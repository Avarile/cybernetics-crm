import { Injectable } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import {
  type EncryptedConnectionParameters,
  type EncryptedImapSmtpCaldavParams,
  type PlaintextConnectionParameters,
  type PlaintextImapSmtpCaldavParams,
} from 'src/engine/core-modules/imap-smtp-caldav-connection/types/imap-smtp-caldav-connection.type';
import { type EncryptedString } from 'src/engine/core-modules/secret-encryption/branded-strings/encrypted-string.type';
import { type PlaintextString } from 'src/engine/core-modules/secret-encryption/branded-strings/plaintext-string.type';
import { SECRET_ENCRYPTION_ENVELOPE_PREFIX } from 'src/engine/core-modules/secret-encryption/constants/secret-encryption.constant';
import {
  SecretEncryptionException,
  SecretEncryptionExceptionCode,
} from 'src/engine/core-modules/secret-encryption/exceptions/secret-encryption.exception';
import { SecretEncryptionService } from 'src/engine/core-modules/secret-encryption/secret-encryption.service';
import { ACCOUNT_TYPES } from 'twenty-shared/constants';

@Injectable()
// Encrypts and decrypts connected account secrets (OAuth tokens and
// IMAP/SMTP/CalDAV passwords) using versioned envelope encryption, so
// plaintext credentials never reach the database.
export class ConnectedAccountTokenEncryptionService {
  constructor(
    private readonly secretEncryptionService: SecretEncryptionService,
  ) {}

  // Encrypts a plaintext secret. Throws if the value already looks like
  // ciphertext, to catch accidental double-encryption bugs.
  encrypt({
    plaintext,
    workspaceId,
  }: {
    plaintext: PlaintextString;
    workspaceId: string;
  }): EncryptedString {
    if (this.looksLikeCiphertext(plaintext)) {
      throw new SecretEncryptionException(
        'ConnectedAccountTokenEncryptionService.encrypt received an already-encrypted envelope. This indicates a double-encryption bug — the caller is encrypting ciphertext.',
        SecretEncryptionExceptionCode.ALREADY_ENCRYPTED,
      );
    }

    return this.secretEncryptionService.encryptVersioned(plaintext, {
      workspaceId,
    });
  }

  // Same as encrypt, but passes through null unchanged.
  encryptNullable({
    plaintext,
    workspaceId,
  }: {
    plaintext: PlaintextString | null;
    workspaceId: string;
  }): EncryptedString | null {
    if (!isDefined(plaintext)) {
      return null;
    }

    return this.encrypt({ plaintext, workspaceId });
  }

  // Decrypts a ciphertext secret. Throws if the value doesn't carry the
  // expected envelope prefix, which usually means an encryption backfill
  // migration hasn't run yet.
  decrypt({
    ciphertext,
    workspaceId,
  }: {
    ciphertext: EncryptedString;
    workspaceId: string;
  }): PlaintextString {
    if (!ciphertext.startsWith(SECRET_ENCRYPTION_ENVELOPE_PREFIX)) {
      throw new SecretEncryptionException(
        'Received a plaintext value where ciphertext was expected. The encryption backfill migration may not have run.',
        SecretEncryptionExceptionCode.MALFORMED_ENVELOPE,
      );
    }

    return this.secretEncryptionService.decryptVersionedOrThrow(ciphertext, {
      workspaceId,
    });
  }

  // Same as decrypt, but passes through null unchanged.
  decryptNullable({
    ciphertext,
    workspaceId,
  }: {
    ciphertext: EncryptedString | null;
    workspaceId: string;
  }): PlaintextString | null {
    if (!isDefined(ciphertext)) {
      return null;
    }

    return this.decrypt({ ciphertext, workspaceId });
  }

  // Encrypts an OAuth access/refresh token pair together.
  encryptTokenPair({
    accessToken,
    refreshToken,
    workspaceId,
  }: {
    accessToken: PlaintextString;
    refreshToken: PlaintextString | null;
    workspaceId: string;
  }): {
    encryptedAccessToken: EncryptedString;
    encryptedRefreshToken: EncryptedString | null;
  } {
    return {
      encryptedAccessToken: this.encrypt({
        plaintext: accessToken,
        workspaceId,
      }),
      encryptedRefreshToken: this.encryptNullable({
        plaintext: refreshToken,
        workspaceId,
      }),
    };
  }

  private looksLikeCiphertext(value: string): boolean {
    return value.startsWith(SECRET_ENCRYPTION_ENVELOPE_PREFIX);
  }

  // Encrypts the password field within each configured protocol
  // (IMAP/SMTP/CALDAV) of a connection parameters object.
  encryptConnectionParameters({
    connectionParameters,
    workspaceId,
  }: {
    connectionParameters: PlaintextImapSmtpCaldavParams;
    workspaceId: string;
  }): EncryptedImapSmtpCaldavParams {
    const result: EncryptedImapSmtpCaldavParams = {
      name: connectionParameters.name ?? null,
    };

    for (const protocol of ACCOUNT_TYPES) {
      const params = connectionParameters[protocol];

      if (!isDefined(params)) {
        continue;
      }

      result[protocol] = {
        ...params,
        password: this.encrypt({ plaintext: params.password, workspaceId }),
      };
    }

    return result;
  }

  // Decrypts the password field within each configured protocol
  // (IMAP/SMTP/CALDAV) of a connection parameters object.
  decryptConnectionParameters({
    connectionParameters,
    workspaceId,
  }: {
    connectionParameters: EncryptedImapSmtpCaldavParams;
    workspaceId: string;
  }): PlaintextImapSmtpCaldavParams {
    const result: PlaintextImapSmtpCaldavParams = {
      name: connectionParameters.name ?? null,
    };

    for (const protocol of ACCOUNT_TYPES) {
      const params = connectionParameters[protocol];

      if (!isDefined(params)) {
        continue;
      }

      result[protocol] = this.decryptProtocolPassword({
        protocolParams: params,
        workspaceId,
      });
    }

    return result;
  }

  // Decrypts the password for a single protocol's connection parameters.
  decryptProtocolPassword({
    protocolParams,
    workspaceId,
  }: {
    protocolParams: EncryptedConnectionParameters;
    workspaceId: string;
  }): PlaintextConnectionParameters {
    return {
      ...protocolParams,
      password: this.decrypt({
        ciphertext: protocolParams.password,
        workspaceId,
      }),
    };
  }
}
