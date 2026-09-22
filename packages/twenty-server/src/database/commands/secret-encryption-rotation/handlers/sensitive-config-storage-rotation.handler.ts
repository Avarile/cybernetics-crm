import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';
import { Repository, type SelectQueryBuilder } from 'typeorm';

import {
  SecretEncryptionRotationHandler,
  type SecretEncryptionRotationContext,
  type SecretEncryptionRotationOutcome,
} from 'src/database/commands/secret-encryption-rotation/interfaces/secret-encryption-rotation-handler.interface';
import { buildRotationErrorMessage } from 'src/database/commands/secret-encryption-rotation/utils/build-rotation-error-message.util';
import {
  KeyValuePairEntity,
  KeyValuePairType,
} from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { isEncryptedString } from 'src/engine/core-modules/secret-encryption/branded-strings/is-encrypted-string.util';
import { SECRET_ENCRYPTION_ENVELOPE_V2_PREFIX } from 'src/engine/core-modules/secret-encryption/constants/secret-encryption.constant';
import { SecretEncryptionService } from 'src/engine/core-modules/secret-encryption/secret-encryption.service';
import { ConfigVariables } from 'src/engine/core-modules/twenty-config/config-variables';
import { type ConfigVariablesMetadataMap } from 'src/engine/core-modules/twenty-config/decorators/config-variables-metadata.decorator';
import { ConfigVariableType } from 'src/engine/core-modules/twenty-config/enums/config-variable-type.enum';
import { TypedReflect } from 'src/utils/typed-reflect';

@Injectable()
// Dedicated rotation handler for the "sensitive-config-storage" site: global
// (no user/workspace) KeyValuePair rows of type CONFIG_VARIABLE whose key is marked
// `isSensitive` + STRING in the config-variables metadata (see TypedReflect). This is
// the untyped site whose encrypted-ness is conditional and can't be expressed as a
// plain entity column in the typed registry.
export class SensitiveConfigStorageRotationHandler extends SecretEncryptionRotationHandler {
  private readonly logger = new Logger(
    SensitiveConfigStorageRotationHandler.name,
  );

  constructor(
    @InjectRepository(KeyValuePairEntity)
    private readonly keyValuePairRepository: Repository<KeyValuePairEntity>,
    private readonly secretEncryptionService: SecretEncryptionService,
  ) {
    super();
  }

  // Counts sensitive config-variable rows not yet on the current encryption key.
  async countRemaining({
    currentEncryptionKeyId,
  }: Pick<
    SecretEncryptionRotationContext,
    'siteName' | 'currentEncryptionKeyId'
  >): Promise<number> {
    const sensitiveStringConfigKeys = this.collectSensitiveStringConfigKeys();

    if (sensitiveStringConfigKeys.length === 0) {
      return 0;
    }

    return this.buildRotationQuery({
      currentEncryptionKeyId,
      sensitiveStringConfigKeys,
    }).getCount();
  }

  // Pages through matching rows by id and rotates each one's value.
  async rotate({
    siteName,
    currentEncryptionKeyId,
    batchSize,
    dryRun,
  }: SecretEncryptionRotationContext): Promise<SecretEncryptionRotationOutcome> {
    const sensitiveStringConfigKeys = this.collectSensitiveStringConfigKeys();

    if (sensitiveStringConfigKeys.length === 0) {
      return { rotated: 0, skipped: 0, errors: 0 };
    }

    const outcome: SecretEncryptionRotationOutcome = {
      rotated: 0,
      skipped: 0,
      errors: 0,
    };
    let cursor = '00000000-0000-0000-0000-000000000000';

    while (true) {
      const rows = await this.buildRotationQuery({
        currentEncryptionKeyId,
        sensitiveStringConfigKeys,
      })
        .andWhere('kvp.id > :cursor', { cursor })
        .orderBy('kvp.id', 'ASC')
        .take(batchSize)
        .getMany();

      if (rows.length === 0) {
        break;
      }

      for (const row of rows) {
        const rowOutcome = await this.rotateRow({ siteName, row, dryRun });

        outcome.rotated += rowOutcome.rotated;
        outcome.skipped += rowOutcome.skipped;
        outcome.errors += rowOutcome.errors;
      }

      cursor = rows[rows.length - 1].id;
    }

    return outcome;
  }

  // Decrypts and re-encrypts a single key-value pair's value.
  private async rotateRow({
    siteName,
    row,
    dryRun,
  }: {
    siteName: SecretEncryptionRotationContext['siteName'];
    row: KeyValuePairEntity;
    dryRun: boolean;
  }): Promise<SecretEncryptionRotationOutcome> {
    const rawValue = row.value as unknown;

    if (!isNonEmptyString(rawValue) || !isEncryptedString(rawValue)) {
      return { rotated: 0, skipped: 0, errors: 1 };
    }

    try {
      const plaintext =
        this.secretEncryptionService.decryptVersionedOrThrow(rawValue);
      const reEncrypted =
        this.secretEncryptionService.encryptVersioned(plaintext);

      if (!dryRun) {
        const updateResult = await this.keyValuePairRepository
          .createQueryBuilder()
          .update()
          .set({ value: reEncrypted as never })
          .where('id = :id', { id: row.id })
          .andWhere('CAST(value AS text) = :originalValueText', {
            originalValueText: JSON.stringify(rawValue),
          })
          .execute();

        if ((updateResult.affected ?? 0) === 0) {
          return { rotated: 0, skipped: 1, errors: 0 };
        }
      }

      return { rotated: 1, skipped: 0, errors: 0 };
    } catch (error) {
      this.logger.error(buildRotationErrorMessage(siteName, row.id, error));

      return { rotated: 0, skipped: 0, errors: 1 };
    }
  }

  // Selects global CONFIG_VARIABLE rows whose key is sensitive and not yet rotated.
  private buildRotationQuery({
    currentEncryptionKeyId,
    sensitiveStringConfigKeys,
  }: {
    currentEncryptionKeyId: string;
    sensitiveStringConfigKeys: string[];
  }): SelectQueryBuilder<KeyValuePairEntity> {
    const currentEnvelopePattern = `"${SECRET_ENCRYPTION_ENVELOPE_V2_PREFIX}${currentEncryptionKeyId}:%"`;

    return this.keyValuePairRepository
      .createQueryBuilder('kvp')
      .where('kvp.type = :type', { type: KeyValuePairType.CONFIG_VARIABLE })
      .andWhere('kvp.userId IS NULL')
      .andWhere('kvp.workspaceId IS NULL')
      .andWhere('kvp.key IN (:...sensitiveStringConfigKeys)', {
        sensitiveStringConfigKeys,
      })
      .andWhere('CAST(kvp.value AS text) NOT LIKE :current', {
        current: currentEnvelopePattern,
      });
  }

  // Reads the config-variables metadata to find every config key marked as a
  // sensitive STRING, which is what makes it eligible for this rotation site.
  private collectSensitiveStringConfigKeys(): string[] {
    const metadata = TypedReflect.getMetadata(
      'config-variables',
      ConfigVariables.prototype.constructor,
    ) as ConfigVariablesMetadataMap | undefined;

    if (!isDefined(metadata)) {
      return [];
    }

    return Object.entries(metadata)
      .filter(
        ([, descriptor]) =>
          descriptor?.isSensitive === true &&
          descriptor?.type === ConfigVariableType.STRING,
      )
      .map(([configKey]) => configKey);
  }
}
