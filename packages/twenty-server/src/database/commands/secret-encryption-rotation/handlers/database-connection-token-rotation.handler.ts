import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { isNonEmptyString } from '@sniptt/guards';
import { WorkspaceActivationStatus } from 'twenty-shared/workspace';
import { In, Not, Like, Repository } from 'typeorm';

import {
  SecretEncryptionRotationHandler,
  type SecretEncryptionRotationContext,
  type SecretEncryptionRotationOutcome,
} from 'src/database/commands/secret-encryption-rotation/interfaces/secret-encryption-rotation-handler.interface';
import { buildCurrentEncryptionKeyIdEnvelopeLikePattern } from 'src/database/commands/secret-encryption-rotation/utils/build-current-encryption-key-id-envelope-like-pattern.util';
import { buildRotationErrorMessage } from 'src/database/commands/secret-encryption-rotation/utils/build-rotation-error-message.util';
import { type EncryptedString } from 'src/engine/core-modules/secret-encryption/branded-strings/encrypted-string.type';
import { SecretEncryptionService } from 'src/engine/core-modules/secret-encryption/secret-encryption.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type WorkspaceRepository } from 'src/engine/twenty-orm/repository/workspace.repository';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { type DatabaseConnectionWorkspaceEntity } from 'src/modules/database-record/standard-objects/database-connection.workspace-entity';

@Injectable()
// Dedicated rotation handler for the data-centre API token. Its rows live in
// each workspace's own schema (databaseConnection is a standard object), so
// unlike the typed core-schema sites it has to visit every workspace.
export class DatabaseConnectionTokenRotationHandler extends SecretEncryptionRotationHandler {
  private readonly logger = new Logger(
    DatabaseConnectionTokenRotationHandler.name,
  );

  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly secretEncryptionService: SecretEncryptionService,
  ) {
    super();
  }

  async countRemaining({
    currentEncryptionKeyId,
  }: Pick<
    SecretEncryptionRotationContext,
    'siteName' | 'currentEncryptionKeyId'
  >): Promise<number> {
    let remaining = 0;

    for (const workspaceId of await this.findWorkspaceIds()) {
      remaining += await this.withConnectionRepository(
        workspaceId,
        (repository) =>
          repository.count({
            where: this.buildNotRotatedWhere(currentEncryptionKeyId),
          }),
      );
    }

    return remaining;
  }

  async rotate({
    siteName,
    currentEncryptionKeyId,
    dryRun,
  }: SecretEncryptionRotationContext): Promise<SecretEncryptionRotationOutcome> {
    const outcome: SecretEncryptionRotationOutcome = {
      rotated: 0,
      skipped: 0,
      errors: 0,
    };

    for (const workspaceId of await this.findWorkspaceIds()) {
      await this.withConnectionRepository(workspaceId, async (repository) => {
        // One connection per workspace, so no paging is needed
        const connections = await repository.find({
          where: this.buildNotRotatedWhere(currentEncryptionKeyId),
        });

        for (const connection of connections) {
          try {
            const plaintext =
              this.secretEncryptionService.decryptVersionedOrThrow(
                connection.encryptedApiToken as EncryptedString,
                { workspaceId },
              );

            if (!dryRun) {
              await repository.update(
                {
                  id: connection.id,
                  encryptedApiToken: connection.encryptedApiToken,
                },
                {
                  encryptedApiToken:
                    this.secretEncryptionService.encryptVersioned(plaintext, {
                      workspaceId,
                    }),
                },
              );
            }

            outcome.rotated++;
          } catch (error) {
            this.logger.error(
              buildRotationErrorMessage(siteName, connection.id, error),
            );
            outcome.errors++;
          }
        }
      });
    }

    return outcome;
  }

  private buildNotRotatedWhere(currentEncryptionKeyId: string) {
    return {
      encryptedApiToken: Not(
        Like(
          buildCurrentEncryptionKeyIdEnvelopeLikePattern(
            currentEncryptionKeyId,
          ),
        ),
      ),
    };
  }

  private async findWorkspaceIds(): Promise<string[]> {
    const workspaces = await this.workspaceRepository.find({
      select: { id: true },
      where: {
        activationStatus: In([
          WorkspaceActivationStatus.ACTIVE,
          WorkspaceActivationStatus.SUSPENDED,
        ]),
      },
    });

    return workspaces
      .map((workspace) => workspace.id)
      .filter((workspaceId) => isNonEmptyString(workspaceId));
  }

  private async withConnectionRepository<TResult>(
    workspaceId: string,
    callback: (
      repository: WorkspaceRepository<DatabaseConnectionWorkspaceEntity>,
    ) => Promise<TResult>,
  ): Promise<TResult> {
    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const repository =
          await this.globalWorkspaceOrmManager.getRepository<DatabaseConnectionWorkspaceEntity>(
            workspaceId,
            'databaseConnection',
            { shouldBypassPermissionChecks: true },
          );

        return callback(repository);
      },
      buildSystemAuthContext(workspaceId),
    );
  }
}
