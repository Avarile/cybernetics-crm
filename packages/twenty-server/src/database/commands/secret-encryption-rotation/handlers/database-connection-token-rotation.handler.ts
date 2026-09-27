import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { isNonEmptyString } from '@sniptt/guards';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';
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
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
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
    private readonly workspaceCacheService: WorkspaceCacheService,
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
      remaining += await this.withConnectionRepositoryIfProvisioned(
        workspaceId,
        (repository) =>
          repository.count({
            where: this.buildNotRotatedWhere(currentEncryptionKeyId),
          }),
        0,
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
      await this.withConnectionRepositoryIfProvisioned(
        workspaceId,
        async (repository) => {
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
        },
        undefined,
      );
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

  // A workspace whose metadata predates the data centre integration has no
  // databaseConnection object; it has nothing to rotate and must not abort
  // the rotation of every other secret
  private async withConnectionRepositoryIfProvisioned<TResult>(
    workspaceId: string,
    callback: (
      repository: WorkspaceRepository<DatabaseConnectionWorkspaceEntity>,
    ) => Promise<TResult>,
    fallback: TResult,
  ): Promise<TResult> {
    const { flatObjectMetadataMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatObjectMetadataMaps',
      ]);

    if (
      !isDefined(
        flatObjectMetadataMaps.byUniversalIdentifier[
          STANDARD_OBJECTS.databaseConnection.universalIdentifier
        ],
      )
    ) {
      return fallback;
    }

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
