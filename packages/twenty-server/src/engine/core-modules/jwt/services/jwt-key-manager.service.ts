// Manages the lifecycle of asymmetric (EC P-256) JWT signing keys: lazily
// creates/loads the current key (with a short in-memory cache to avoid
// hammering the DB), rotates to a new current key, and revokes old keys.
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { generateKeyPairSync, randomUUID } from 'crypto';

import { isNonEmptyString } from '@sniptt/guards';
import { isDefined, isValidUuid } from 'twenty-shared/utils';
import { IsNull, QueryFailedError, Repository } from 'typeorm';

import { CoreEntityCacheService } from 'src/engine/core-entity-cache/services/core-entity-cache.service';
import { SigningKeyEntity } from 'src/engine/core-modules/jwt/entities/signing-key.entity';
import {
  JwtKeyManagerException,
  JwtKeyManagerExceptionCode,
} from 'src/engine/core-modules/jwt/jwt-key-manager.exception';
import { type EncryptedString } from 'src/engine/core-modules/secret-encryption/branded-strings/encrypted-string.type';
import { type PlaintextString } from 'src/engine/core-modules/secret-encryption/branded-strings/plaintext-string.type';
import { SecretEncryptionService } from 'src/engine/core-modules/secret-encryption/secret-encryption.service';

export type CurrentSigningKey = {
  id: string;
  privateKeyPem: string;
};

const UNIQUE_VIOLATION_PG_CODE = '23505';
const CURRENT_SIGNING_KEY_LOCAL_TTL_MS = 60 * 1000;

@Injectable()
export class JwtKeyManagerService {
  private readonly logger = new Logger(JwtKeyManagerService.name);

  private currentSigningKeyPromise: Promise<CurrentSigningKey | null> | null =
    null;
  private currentSigningKeyCachedAt = 0;

  constructor(
    @InjectRepository(SigningKeyEntity)
    private readonly signingKeyRepository: Repository<SigningKeyEntity>,
    private readonly coreEntityCacheService: CoreEntityCacheService,
    private readonly secretEncryptionService: SecretEncryptionService,
  ) {}

  // Returns the current signing key (id + decrypted private key), caching
  // the in-flight/loaded promise briefly to reduce DB load; returns null
  // (falling back to legacy signing) if none could be loaded or created.
  async getCurrentSigningKey(): Promise<CurrentSigningKey | null> {
    const isLocalCacheExpired =
      Date.now() - this.currentSigningKeyCachedAt >
      CURRENT_SIGNING_KEY_LOCAL_TTL_MS;

    if (!isDefined(this.currentSigningKeyPromise) || isLocalCacheExpired) {
      this.currentSigningKeyPromise = this.loadOrCreateCurrentSigningKey();
      this.currentSigningKeyCachedAt = Date.now();
    }

    try {
      const result = await this.currentSigningKeyPromise;

      if (!isDefined(result)) {
        this.invalidateCurrentSigningKeyLocalCache();
      }

      return result;
    } catch (error) {
      this.invalidateCurrentSigningKeyLocalCache();
      throw error;
    }
  }

  // Looks up a signing key's public key PEM by id via the entity cache, used
  // to verify tokens signed with a (possibly non-current) known key.
  async getValidPublicKeyPemById(id: string): Promise<string | null> {
    if (!isNonEmptyString(id) || !isValidUuid(id)) {
      return null;
    }

    return this.coreEntityCacheService.get('signingKeyPublicKey', id);
  }

  // Lists all signing keys, newest first.
  async listSigningKeys(): Promise<SigningKeyEntity[]> {
    return this.signingKeyRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  // Generates a new key pair, atomically demotes the previous current key
  // (clearing its private key) and inserts the new one as current, then
  // invalidates the relevant caches.
  async rotateCurrent(): Promise<CurrentSigningKey> {
    const generated = this.generateEcP256KeyPair();
    const newId = randomUUID();

    await this.signingKeyRepository.manager.transaction(
      async (entityManager) => {
        const repository = entityManager.getRepository(SigningKeyEntity);

        await repository.update(
          { isCurrent: true },
          { isCurrent: false, privateKey: null },
        );

        await repository.insert({
          id: newId,
          publicKey: generated.publicKeyPem,
          privateKey: this.secretEncryptionService.encryptVersioned(
            generated.privateKeyPem,
          ),
          isCurrent: true,
          revokedAt: null,
        });
      },
    );

    await this.coreEntityCacheService.invalidate('signingKeyPublicKey', newId);
    this.invalidateCurrentSigningKeyLocalCache();

    return { id: newId, privateKeyPem: generated.privateKeyPem };
  }

  // Marks a signing key revoked (clearing its private key so it can no
  // longer sign), throwing if the id is invalid or the key doesn't exist.
  async revokeSigningKey(id: string): Promise<SigningKeyEntity> {
    if (!isNonEmptyString(id) || !isValidUuid(id)) {
      throw new JwtKeyManagerException(
        `Invalid signing key id: ${id}`,
        JwtKeyManagerExceptionCode.SIGNING_KEY_NOT_FOUND,
      );
    }

    const existing = await this.signingKeyRepository.findOne({ where: { id } });

    if (!isDefined(existing)) {
      throw new JwtKeyManagerException(
        `Signing key not found: ${id}`,
        JwtKeyManagerExceptionCode.SIGNING_KEY_NOT_FOUND,
      );
    }

    if (!isDefined(existing.revokedAt)) {
      await this.signingKeyRepository.update(
        { id },
        {
          revokedAt: new Date(),
          isCurrent: false,
          privateKey: null,
        },
      );
    }

    await this.coreEntityCacheService.invalidate('signingKeyPublicKey', id);
    this.invalidateCurrentSigningKeyLocalCache();

    return this.signingKeyRepository.findOneByOrFail({ id });
  }

  // Clears the short-lived in-memory cache of the current signing key.
  private invalidateCurrentSigningKeyLocalCache(): void {
    this.currentSigningKeyPromise = null;
    this.currentSigningKeyCachedAt = 0;
  }

  // Loads the existing current key row if present, otherwise generates and
  // persists a new one. Swallows errors (logging them) so callers fall back
  // to legacy signing rather than crashing.
  private async loadOrCreateCurrentSigningKey(): Promise<CurrentSigningKey | null> {
    try {
      const existing = await this.findCurrentSigningKeyRow();

      if (isDefined(existing)) {
        return {
          id: existing.id,
          privateKeyPem: this.decryptPrivateKey(
            existing.privateKey,
            existing.id,
          ),
        };
      }

      return await this.generateAndPersistCurrent();
    } catch (error) {
      this.logger.error(
        `Failed to load or create current signing key. Falling back to legacy HS256 signing. Error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      return null;
    }
  }

  // Finds the active (non-revoked) row marked as the current signing key.
  private async findCurrentSigningKeyRow(): Promise<SigningKeyEntity | null> {
    return this.signingKeyRepository.findOne({
      where: { isCurrent: true, revokedAt: IsNull() },
    });
  }

  // Decrypts a stored private key, throwing if it's missing.
  private decryptPrivateKey(
    encryptedPrivateKey: EncryptedString | null,
    id: string,
  ): string {
    if (!isDefined(encryptedPrivateKey)) {
      throw new JwtKeyManagerException(
        `Current signing key (id=${id}) has no privateKey`,
        JwtKeyManagerExceptionCode.INVALID_PRIVATE_KEY,
      );
    }

    return this.secretEncryptionService.decryptVersionedOrThrow(
      encryptedPrivateKey,
    );
  }

  // Generates and inserts a brand-new current signing key. If a concurrent
  // process already inserted one (unique constraint violation), falls back
  // to reading and returning that one instead of failing.
  private async generateAndPersistCurrent(): Promise<CurrentSigningKey> {
    const generated = this.generateEcP256KeyPair();
    const id = randomUUID();

    try {
      await this.signingKeyRepository.insert({
        id,
        publicKey: generated.publicKeyPem,
        privateKey: this.secretEncryptionService.encryptVersioned(
          generated.privateKeyPem,
        ),
        isCurrent: true,
        revokedAt: null,
      });

      await this.coreEntityCacheService.invalidate('signingKeyPublicKey', id);

      return { id, privateKeyPem: generated.privateKeyPem };
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        const existing = await this.findCurrentSigningKeyRow();

        if (isDefined(existing)) {
          return {
            id: existing.id,
            privateKeyPem: this.decryptPrivateKey(
              existing.privateKey,
              existing.id,
            ),
          };
        }
      }

      throw error;
    }
  }

  // Generates a fresh EC P-256 key pair, PEM-encoded.
  private generateEcP256KeyPair(): {
    privateKeyPem: PlaintextString;
    publicKeyPem: string;
  } {
    const { privateKey, publicKey } = generateKeyPairSync('ec', {
      namedCurve: 'P-256',
    });

    const privateKeyPem = privateKey
      .export({ format: 'pem', type: 'pkcs8' })
      .toString() as PlaintextString;
    const publicKeyPem = publicKey
      .export({ format: 'pem', type: 'spki' })
      .toString();

    return { privateKeyPem, publicKeyPem };
  }

  // Detects a Postgres unique-constraint violation from a TypeORM error.
  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof QueryFailedError &&
      (error as QueryFailedError & { code?: string }).code ===
        UNIQUE_VIOLATION_PG_CODE
    );
  }
}
