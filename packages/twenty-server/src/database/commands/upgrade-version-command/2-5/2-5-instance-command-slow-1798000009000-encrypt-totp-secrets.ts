import { isDefined } from 'twenty-shared/utils';
import { DataSource, QueryRunner } from 'typeorm';

import { type PlaintextString } from 'src/engine/core-modules/secret-encryption/branded-strings/plaintext-string.type';
import { SECRET_ENCRYPTION_ENVELOPE_V2_PREFIX } from 'src/engine/core-modules/secret-encryption/constants/secret-encryption.constant';
import { SecretEncryptionService } from 'src/engine/core-modules/secret-encryption/secret-encryption.service';
import { SimpleSecretEncryptionUtil } from 'src/engine/core-modules/two-factor-authentication/utils/simple-secret-encryption.util';
import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { SlowInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/slow-instance-command.interface';

const BACKFILL_BATCH_SIZE = 500;

const SECRET_CHECK_CONSTRAINT_NAME =
  'CHK_twoFactorAuthenticationMethod_secret_encrypted';

const V2_ENCRYPTED_LIKE_PATTERN = `${SECRET_ENCRYPTION_ENVELOPE_V2_PREFIX}%`;

type TwoFactorMethodRow = {
  id: string;
  workspaceId: string;
  userId: string;
  secret: string;
};

@RegisteredInstanceCommand('2.5.0', 1798000009000, { type: 'slow' })
export class EncryptTotpSecretsSlowInstanceCommand implements SlowInstanceCommand {
  constructor(
    private readonly secretEncryptionService: SecretEncryptionService,
    private readonly simpleSecretEncryptionUtil: SimpleSecretEncryptionUtil,
  ) {}

  // Keyset pagination (id > cursor) rather than OFFSET: stays O(1) per page as rows are
  // encrypted out of the WHERE clause's match set, instead of re-scanning skipped rows.
  async runDataMigration(dataSource: DataSource): Promise<void> {
    let cursor = '00000000-0000-0000-0000-000000000000';

    while (true) {
      const rows: TwoFactorMethodRow[] = await dataSource.query(
        `SELECT m.id, m."workspaceId", uw."userId", m."secret"
           FROM "core"."twoFactorAuthenticationMethod" m
           JOIN "core"."userWorkspace" uw
             ON uw.id = m."userWorkspaceId"
          WHERE m.id > $1
            AND m."secret" NOT LIKE $2
          ORDER BY m.id
          LIMIT $3`,
        [cursor, V2_ENCRYPTED_LIKE_PATTERN, BACKFILL_BATCH_SIZE],
      );

      if (rows.length === 0) {
        break;
      }

      for (const row of rows) {
        // Context string must reproduce the original per-user/workspace key derivation
        // (see SimpleSecretEncryptionUtil) exactly, or decryption fails silently.
        const plaintext = await this.simpleSecretEncryptionUtil.decryptSecret(
          row.secret,
          `${row.userId}${row.workspaceId}otp-secret`,
        );

        if (!isDefined(plaintext)) {
          continue;
        }

        const encryptedValue = this.secretEncryptionService.encryptVersioned(
          plaintext as PlaintextString,
          { workspaceId: row.workspaceId },
        );

        await dataSource.query(
          `UPDATE "core"."twoFactorAuthenticationMethod"
              SET "secret" = $2
            WHERE id = $1`,
          [row.id, encryptedValue],
        );
      }

      cursor = rows[rows.length - 1].id;
    }
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."twoFactorAuthenticationMethod"
       ADD CONSTRAINT "${SECRET_CHECK_CONSTRAINT_NAME}"
       CHECK ("secret" LIKE '${V2_ENCRYPTED_LIKE_PATTERN}')`,
    );
  }

  // Deliberately do NOT decrypt rows on rollback — re-introducing plaintext TOTP
  // secrets to the database would be a security regression. Dropping the CHECK
  // constraint is enough.
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."twoFactorAuthenticationMethod"
       DROP CONSTRAINT IF EXISTS "${SECRET_CHECK_CONSTRAINT_NAME}"`,
    );
  }
}
