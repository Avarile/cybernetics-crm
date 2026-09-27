import { Injectable } from '@nestjs/common';

import { type EncryptedString } from 'src/engine/core-modules/secret-encryption/branded-strings/encrypted-string.type';
import { type PlaintextString } from 'src/engine/core-modules/secret-encryption/branded-strings/plaintext-string.type';
import { SecretEncryptionService } from 'src/engine/core-modules/secret-encryption/secret-encryption.service';
import {
  DatabaseCentreException,
  DatabaseCentreExceptionCode,
} from 'src/modules/database-record/exceptions/database-centre.exception';

const TOKEN_FINGERPRINT_VISIBLE_CHARACTERS = 4;

// Encrypts the data-centre API token at rest with the platform's versioned
// envelope encryption, so plaintext tokens never reach the database and
// rotate along with every other platform secret.
@Injectable()
export class DatabaseConnectionTokenEncryptionService {
  constructor(
    private readonly secretEncryptionService: SecretEncryptionService,
  ) {}

  encrypt({
    apiToken,
    workspaceId,
  }: {
    apiToken: string;
    workspaceId: string;
  }): EncryptedString {
    return this.secretEncryptionService.encryptVersioned(
      apiToken as PlaintextString,
      { workspaceId },
    );
  }

  decryptOrThrow({
    encryptedApiToken,
    workspaceId,
  }: {
    encryptedApiToken: string;
    workspaceId: string;
  }): string {
    try {
      return this.secretEncryptionService.decryptVersionedOrThrow(
        encryptedApiToken as EncryptedString,
        { workspaceId },
      );
    } catch {
      throw new DatabaseCentreException(
        `Could not decrypt the data centre token for workspace ${workspaceId}`,
        DatabaseCentreExceptionCode.TOKEN_DECRYPTION_FAILED,
      );
    }
  }

  // Shown in settings so admins can tell which token is stored without it
  // ever being decrypted for display
  buildFingerprint(apiToken: string): string {
    return `••••${apiToken.slice(-TOKEN_FINGERPRINT_VISIBLE_CHARACTERS)}`;
  }
}
