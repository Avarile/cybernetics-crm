import { Injectable, Logger } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { type EncryptedString } from 'src/engine/core-modules/secret-encryption/branded-strings/encrypted-string.type';
import { type PlaintextString } from 'src/engine/core-modules/secret-encryption/branded-strings/plaintext-string.type';
import {
  SecretEncryptionException,
  SecretEncryptionExceptionCode,
} from 'src/engine/core-modules/secret-encryption/exceptions/secret-encryption.exception';
import { EnvironmentConfigDriver } from 'src/engine/core-modules/twenty-config/drivers/environment-config.driver';

import { computeEncryptionKeyId } from './utils/compute-encryption-key-id.util';
import { decryptAesCtrOrThrow } from './utils/decrypt-aes-ctr-or-throw.util';
import { decryptAesGcmV2OrThrow } from './utils/decrypt-aes-gcm-v2-or-throw.util';
import { encryptAesCtr } from './utils/encrypt-aes-ctr.util';
import { encryptAesGcmV2 } from './utils/encrypt-aes-gcm-v2.util';
import { formatSecretEncryptionEnvelopeV2 } from './utils/format-secret-encryption-envelope-v2.util';
import { parseSecretEncryptionEnvelopeOrThrow } from './utils/parse-secret-encryption-envelope-or-throw.util';
import { pickEncryptionKeyByKeyIdOrThrow } from './utils/pick-encryption-key-by-key-id-or-throw.util';
import { resolveEncryptionKeysOrThrow } from './utils/resolve-encryption-keys-or-throw.util';

type VersionedOptions = {
  workspaceId?: string;
};

// Encrypts and decrypts secrets at rest: legacy unversioned AES-CTR for old
// callers, and the current versioned enc:v2 AES-GCM envelope for new ones
@Injectable()
export class SecretEncryptionService {
  private readonly logger = new Logger(SecretEncryptionService.name);
  private hasLoggedLegacyCtrDecryption = false;

  constructor(
    private readonly environmentConfigDriver: EnvironmentConfigDriver,
  ) {}

  // Legacy CTR pair (`encrypt` / `decrypt`) is intentionally left unbranded.
  // Its callers predate the enc:v2 envelope and never went through the
  // branded API; retrofitting them is tracked as a separate follow-up.
  public encrypt(value: string): string {
    if (!isDefined(value)) {
      return value;
    }

    const { primary } = resolveEncryptionKeysOrThrow({
      environmentConfigDriver: this.environmentConfigDriver,
    });

    return encryptAesCtr({ plaintext: value, rawKey: primary });
  }

  // Legacy CTR has no integrity tag, so a wrong key produces an arbitrary
  // byte sequence rather than throwing. Rotation of these rows requires
  // migrating the consumer to the versioned envelope first.
  public decrypt(value: string): string {
    if (!isDefined(value)) {
      return value;
    }

    const { primary } = resolveEncryptionKeysOrThrow({
      environmentConfigDriver: this.environmentConfigDriver,
    });

    return decryptAesCtrOrThrow({ ciphertext: value, rawKey: primary });
  }

  // Decrypts a legacy value and masks it for display, revealing only a short prefix
  public decryptAndMask({
    value,
    mask,
  }: {
    value: string;
    mask: string;
  }): string {
    if (!isDefined(value)) {
      return value;
    }

    return this.maskDecryptedValue(this.decrypt(value), mask);
  }

  // Decrypts a versioned (enc:v2) value and masks it for display
  public decryptAndMaskVersioned({
    value,
    mask,
    workspaceId,
  }: {
    value: EncryptedString;
    mask: string;
    workspaceId?: string;
  }): string {
    if (!isDefined(value)) {
      return value;
    }

    return this.maskDecryptedValue(
      this.decryptVersionedOrThrow(value, { workspaceId }),
      mask,
    );
  }

  private maskDecryptedValue(decryptedValue: string, mask: string): string {
    // Visible-char count caps at 5 and at one-tenth of the secret length, so
    // short secrets reveal nothing and longer secrets reveal a stable prefix.
    const visibleCharsCount = Math.min(
      5,
      Math.floor(decryptedValue.length / 10),
    );

    return `${decryptedValue.slice(0, visibleCharsCount)}${mask}`;
  }

  // Encrypts plaintext into the current enc:v2 envelope using the primary key
  public encryptVersioned(
    value: PlaintextString,
    opts: VersionedOptions = {},
  ): EncryptedString {
    if (!isDefined(value)) {
      return value;
    }

    const { primary } = resolveEncryptionKeysOrThrow({
      environmentConfigDriver: this.environmentConfigDriver,
    });
    const payloadBase64 = encryptAesGcmV2({
      plaintext: value,
      rawKey: primary,
      workspaceId: opts.workspaceId,
    });
    const keyId = computeEncryptionKeyId({ rawKey: primary });

    return formatSecretEncryptionEnvelopeV2({
      keyId,
      payloadBase64,
    }) as EncryptedString;
  }

  // Decrypts an enc:v2 envelope, throwing if the value isn't a v2 envelope or
  // its key id doesn't match any configured encryption key
  public decryptVersionedOrThrow(
    value: EncryptedString,
    opts: VersionedOptions = {},
  ): PlaintextString {
    if (!isDefined(value)) {
      return value;
    }

    const parsed = parseSecretEncryptionEnvelopeOrThrow({ value });

    if (parsed.version !== 2) {
      throw new SecretEncryptionException(
        'Expected an enc:v2 envelope but received a non-versioned value. The 2.5 encryption backfill instance commands must have run before this value can be decrypted.',
        SecretEncryptionExceptionCode.UNKNOWN_ENVELOPE_VERSION,
      );
    }

    const keys = resolveEncryptionKeysOrThrow({
      environmentConfigDriver: this.environmentConfigDriver,
    });
    const rawKey = pickEncryptionKeyByKeyIdOrThrow({
      keyId: parsed.keyId,
      keys,
    });

    return decryptAesGcmV2OrThrow({
      payloadBase64: parsed.payload,
      rawKey,
      workspaceId: opts.workspaceId,
    }) as PlaintextString;
  }

  /**
   * @deprecated Legacy variant kept only for the 2.5 encryption backfill
   * instance commands, which read pre-v2 rows (legacy AES-CTR ciphertext or
   * plaintext) and re-encrypt them into the enc:v2 envelope. Runtime and
   * rotation paths must use `decryptVersionedOrThrow` instead.
   */
  public legacyDecryptVersionedWithFallback(
    value: EncryptedString,
    opts: VersionedOptions = {},
  ): PlaintextString {
    if (!isDefined(value)) {
      return value;
    }

    const parsed = parseSecretEncryptionEnvelopeOrThrow({ value });

    if (parsed.version === 2) {
      const keys = resolveEncryptionKeysOrThrow({
        environmentConfigDriver: this.environmentConfigDriver,
      });
      const rawKey = pickEncryptionKeyByKeyIdOrThrow({
        keyId: parsed.keyId,
        keys,
      });

      return decryptAesGcmV2OrThrow({
        payloadBase64: parsed.payload,
        rawKey,
        workspaceId: opts.workspaceId,
      }) as PlaintextString;
    }

    this.warnLegacyCtrDecryptionOnce();

    return this.decrypt(value) as PlaintextString;
  }

  // Logs the legacy-CTR-decryption warning once per process, to avoid log spam
  private warnLegacyCtrDecryptionOnce(): void {
    if (this.hasLoggedLegacyCtrDecryption) {
      return;
    }

    this.hasLoggedLegacyCtrDecryption = true;
    this.logger.warn(
      'Decrypted a legacy unprefixed AES-CTR ciphertext. These rows should be re-encrypted into the enc:v2 envelope in a follow-up migration.',
    );
  }
}
