// Reads and updates an installed application's runtime configuration
// variables, encrypting values at rest and masking secret values for
// display.
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { isDefined } from 'twenty-shared/utils';
import { Repository } from 'typeorm';

import { ApplicationVariableEntity } from 'src/engine/core-modules/application/application-variable/application-variable.entity';
import {
  ApplicationVariableEntityException,
  ApplicationVariableEntityExceptionCode,
} from 'src/engine/core-modules/application/application-variable/application-variable.exception';
import { SECRET_APPLICATION_VARIABLE_MASK } from 'src/engine/core-modules/application/application-variable/constants/secret-application-variable-mask.constant';
import { type PlaintextString } from 'src/engine/core-modules/secret-encryption/branded-strings/plaintext-string.type';
import { SecretEncryptionService } from 'src/engine/core-modules/secret-encryption/secret-encryption.service';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';

@Injectable()
export class ApplicationVariableEntityService {
  constructor(
    @InjectRepository(ApplicationVariableEntity)
    private readonly applicationVariableRepository: Repository<ApplicationVariableEntity>,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly secretEncryptionService: SecretEncryptionService,
  ) {}

  // Returns a variable's decrypted value, masked when flagged secret.
  getDisplayValue(applicationVariable: ApplicationVariableEntity): string {
    if (applicationVariable.value === '') {
      return '';
    }

    if (applicationVariable.isSecret) {
      return this.secretEncryptionService.decryptAndMaskVersioned({
        value: applicationVariable.value,
        mask: SECRET_APPLICATION_VARIABLE_MASK,
        workspaceId: applicationVariable.workspaceId,
      });
    }

    return this.secretEncryptionService.decryptVersionedOrThrow(
      applicationVariable.value,
      { workspaceId: applicationVariable.workspaceId },
    );
  }

  // Encrypts and stores a new value for an existing variable, then
  // refreshes the workspace's application variable cache.
  async update({
    key,
    plainTextValue,
    applicationId,
    workspaceId,
  }: Pick<ApplicationVariableEntity, 'key'> & {
    applicationId: string;
    workspaceId: string;
    plainTextValue: PlaintextString;
  }) {
    const existingVariable = await this.applicationVariableRepository.findOne({
      where: { key, applicationId },
    });

    if (!isDefined(existingVariable)) {
      throw new ApplicationVariableEntityException(
        `Application variable with key ${key} not found`,
        ApplicationVariableEntityExceptionCode.APPLICATION_VARIABLE_NOT_FOUND,
      );
    }

    await this.applicationVariableRepository.update(
      { key, applicationId },
      {
        value: this.secretEncryptionService.encryptVersioned(plainTextValue, {
          workspaceId,
        }),
      },
    );

    await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
      'applicationVariableMaps',
    ]);
  }
}
