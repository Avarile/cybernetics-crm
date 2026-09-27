import { Injectable } from '@nestjs/common';

import { msg } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type WorkspaceRepository } from 'src/engine/twenty-orm/repository/workspace.repository';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { CyberneticsDataCentreClientService } from 'src/modules/database-record/client/cybernetics-data-centre-client.service';
import { type DataCentreConnectionCredentials } from 'src/modules/database-record/client/types/cybernetics-data-centre-api.types';
import {
  type DatabaseConnectionDTO,
  type DatabaseConnectionVerificationDTO,
  type UpsertDatabaseConnectionInput,
} from 'src/modules/database-record/dtos/database-connection.dto';
import {
  DatabaseCentreException,
  DatabaseCentreExceptionCode,
} from 'src/modules/database-record/exceptions/database-centre.exception';
import { DatabaseConnectionTokenEncryptionService } from 'src/modules/database-record/services/database-connection-token-encryption.service';
import { type DatabaseConnectionWorkspaceEntity } from 'src/modules/database-record/standard-objects/database-connection.workspace-entity';
import { type DatabaseConnectionVerificationStatus } from 'src/modules/database-record/types/database-centre-status.type';
import { normalizeDatabaseCentreBaseUrl } from 'src/modules/database-record/utils/normalize-database-centre-base-url.util';

export type ActiveDatabaseConnection = {
  connection: DatabaseConnectionWorkspaceEntity;
  credentials: DataCentreConnectionCredentials;
};

// Manages a workspace's single data-centre connection: reading it for
// settings, saving it with the token encrypted, probing it, and handing
// decrypted credentials to the browse/attach services.
@Injectable()
export class DatabaseConnectionService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly cyberneticsDataCentreClientService: CyberneticsDataCentreClientService,
    private readonly databaseConnectionTokenEncryptionService: DatabaseConnectionTokenEncryptionService,
  ) {}

  async findConnection(
    workspaceId: string,
  ): Promise<DatabaseConnectionWorkspaceEntity | null> {
    return this.withConnectionRepository(workspaceId, (repository) =>
      repository.findOne({ where: {}, order: { createdAt: 'ASC' } }),
    );
  }

  async getConnectionDTO(
    workspaceId: string,
  ): Promise<DatabaseConnectionDTO | null> {
    const connection = await this.findConnection(workspaceId);

    return isDefined(connection) ? this.toDTO(connection) : null;
  }

  async upsertConnection(
    workspaceId: string,
    input: UpsertDatabaseConnectionInput,
  ): Promise<DatabaseConnectionDTO> {
    const baseUrl = normalizeDatabaseCentreBaseUrl(input.baseUrl);

    // Reject unsafe hosts before persisting, not only at request time
    await this.cyberneticsDataCentreClientService.assertBaseUrlIsAllowed(
      baseUrl,
    );

    const existingConnection = await this.findConnection(workspaceId);

    if (!isDefined(existingConnection) && !isNonEmptyString(input.apiToken)) {
      throw new DatabaseCentreException(
        'An API token is required to create a data centre connection',
        DatabaseCentreExceptionCode.CONNECTION_NOT_CONFIGURED,
        { userFriendlyMessage: msg`An API token is required.` },
      );
    }

    const tokenFields = isNonEmptyString(input.apiToken)
      ? {
          encryptedApiToken:
            this.databaseConnectionTokenEncryptionService.encrypt({
              apiToken: input.apiToken,
              workspaceId,
            }),
          tokenFingerprint:
            this.databaseConnectionTokenEncryptionService.buildFingerprint(
              input.apiToken,
            ),
        }
      : {};

    const credentialsChanged =
      !isDefined(existingConnection) ||
      isNonEmptyString(input.apiToken) ||
      existingConnection.baseUrl !== baseUrl;

    const verificationFields = credentialsChanged
      ? {
          lastVerifiedAt: null,
          lastVerificationStatus:
            'UNVERIFIED' satisfies DatabaseConnectionVerificationStatus,
        }
      : {};

    await this.withConnectionRepository(workspaceId, async (repository) => {
      if (isDefined(existingConnection)) {
        await repository.update(
          { id: existingConnection.id },
          {
            name: input.name.trim(),
            baseUrl,
            isEnabled: input.isEnabled,
            ...tokenFields,
            ...verificationFields,
          },
        );

        return;
      }

      await repository.insert({
        name: input.name.trim(),
        baseUrl,
        isEnabled: input.isEnabled,
        ...tokenFields,
        ...verificationFields,
      });
    });

    const savedConnection = await this.findConnection(workspaceId);

    if (!isDefined(savedConnection)) {
      throw new DatabaseCentreException(
        `Data centre connection could not be saved for workspace ${workspaceId}`,
        DatabaseCentreExceptionCode.CONNECTION_NOT_CONFIGURED,
      );
    }

    return this.toDTO(savedConnection);
  }

  // Probes one base, one table and one record, which is enough to exercise
  // every read scope the integration needs
  async verifyConnection(
    workspaceId: string,
  ): Promise<DatabaseConnectionVerificationDTO> {
    const connection = await this.findConnectionOrThrow(workspaceId);
    const credentials = this.buildCredentials(connection, workspaceId);

    let status: DatabaseConnectionVerificationStatus = 'OK';
    let message = '';
    let basesVisible = 0;

    try {
      const bases = await this.cyberneticsDataCentreClientService.listBases(
        credentials,
        workspaceId,
      );

      basesVisible = bases.length;

      const firstBaseId = bases[0]?.id;

      if (isNonEmptyString(firstBaseId)) {
        const tables = await this.cyberneticsDataCentreClientService.listTables(
          credentials,
          workspaceId,
          firstBaseId,
        );

        const firstTableId = tables[0]?.id;

        if (isNonEmptyString(firstTableId)) {
          await this.cyberneticsDataCentreClientService.listRecords(
            credentials,
            workspaceId,
            firstTableId,
            { take: 1, skip: 0 },
          );
        }
      }
    } catch (error) {
      if (!(error instanceof DatabaseCentreException)) {
        throw error;
      }

      status =
        error.code === DatabaseCentreExceptionCode.UPSTREAM_UNAUTHORIZED ||
        error.code === DatabaseCentreExceptionCode.UPSTREAM_FORBIDDEN
          ? 'UNAUTHORIZED'
          : 'UNREACHABLE';
      message = error.message;
    }

    await this.withConnectionRepository(workspaceId, (repository) =>
      repository.update(
        { id: connection.id },
        {
          lastVerifiedAt: new Date().toISOString(),
          lastVerificationStatus: status,
        },
      ),
    );

    const refreshedConnection = await this.findConnectionOrThrow(workspaceId);

    return {
      status,
      message,
      basesVisible,
      connection: this.toDTO(refreshedConnection),
    };
  }

  async getActiveConnectionOrThrow(
    workspaceId: string,
  ): Promise<ActiveDatabaseConnection> {
    const connection = await this.findConnectionOrThrow(workspaceId);

    if (!connection.isEnabled) {
      throw new DatabaseCentreException(
        `Data centre connection is disabled for workspace ${workspaceId}`,
        DatabaseCentreExceptionCode.CONNECTION_DISABLED,
      );
    }

    return {
      connection,
      credentials: this.buildCredentials(connection, workspaceId),
    };
  }

  private async findConnectionOrThrow(
    workspaceId: string,
  ): Promise<DatabaseConnectionWorkspaceEntity> {
    const connection = await this.findConnection(workspaceId);

    if (!isDefined(connection)) {
      throw new DatabaseCentreException(
        `No data centre connection configured for workspace ${workspaceId}`,
        DatabaseCentreExceptionCode.CONNECTION_NOT_CONFIGURED,
      );
    }

    return connection;
  }

  private buildCredentials(
    connection: DatabaseConnectionWorkspaceEntity,
    workspaceId: string,
  ): DataCentreConnectionCredentials {
    if (!isNonEmptyString(connection.encryptedApiToken)) {
      throw new DatabaseCentreException(
        `Data centre connection ${connection.id} has no stored token`,
        DatabaseCentreExceptionCode.CONNECTION_NOT_CONFIGURED,
      );
    }

    return {
      baseUrl: connection.baseUrl,
      apiToken: this.databaseConnectionTokenEncryptionService.decryptOrThrow({
        encryptedApiToken: connection.encryptedApiToken,
        workspaceId,
      }),
    };
  }

  private toDTO(
    connection: DatabaseConnectionWorkspaceEntity,
  ): DatabaseConnectionDTO {
    return {
      id: connection.id,
      name: connection.name,
      baseUrl: connection.baseUrl,
      tokenFingerprint: connection.tokenFingerprint,
      isEnabled: connection.isEnabled,
      lastVerifiedAt: connection.lastVerifiedAt,
      lastVerificationStatus: connection.lastVerificationStatus ?? 'UNVERIFIED',
    };
  }

  // Connection rows are only ever touched through the settings-permission
  // guarded resolvers, so permission checks are bypassed at the ORM level
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
