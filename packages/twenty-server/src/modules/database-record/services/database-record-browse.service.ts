import { Injectable } from '@nestjs/common';

import { createHash } from 'crypto';

import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

import { InjectCacheStorage } from 'src/engine/core-modules/cache-storage/decorators/cache-storage.decorator';
import { CacheStorageService } from 'src/engine/core-modules/cache-storage/services/cache-storage.service';
import { CacheStorageNamespace } from 'src/engine/core-modules/cache-storage/types/cache-storage-namespace.enum';
import { CyberneticsDataCentreClientService } from 'src/modules/database-record/client/cybernetics-data-centre-client.service';
import {
  type DataCentreApiBase,
  type DataCentreApiField,
  type DataCentreApiRecord,
  type DataCentreApiTable,
} from 'src/modules/database-record/client/types/cybernetics-data-centre-api.types';
import { DATABASE_CENTRE_CACHE_TTL_SECONDS } from 'src/modules/database-record/constants/database-centre.constants';
import {
  type DatabaseCentreFieldDTO,
  type DatabaseCentreRecordDetailDTO,
  type DatabaseCentreRecordDTO,
  type DatabaseCentreRecordPageDTO,
  type DatabaseCentreRecordsQueryInput,
  type DatabaseCentreSpaceDTO,
  type DatabaseCentreTableDTO,
  type DatabaseCentreTableSchemaDTO,
} from 'src/modules/database-record/dtos/database-centre-browse.dto';
import {
  DatabaseCentreException,
  DatabaseCentreExceptionCode,
} from 'src/modules/database-record/exceptions/database-centre.exception';
import {
  type ActiveDatabaseConnection,
  DatabaseConnectionService,
} from 'src/modules/database-record/services/database-connection.service';
import { buildDatabaseCentreDeepLink } from 'src/modules/database-record/utils/build-database-centre-deep-link.util';

type CacheKind = keyof typeof DATABASE_CENTRE_CACHE_TTL_SECONDS;

// Read-only browsing of the data centre (spaces/bases → tables → schema →
// records) on behalf of a workspace, shaping upstream payloads into GraphQL
// DTOs and caching the slow-changing metadata lookups.
@Injectable()
export class DatabaseRecordBrowseService {
  constructor(
    private readonly databaseConnectionService: DatabaseConnectionService,
    private readonly cyberneticsDataCentreClientService: CyberneticsDataCentreClientService,
    @InjectCacheStorage(CacheStorageNamespace.ModuleDatabaseCentre)
    private readonly cacheStorageService: CacheStorageService,
  ) {}

  async listSpaces(workspaceId: string): Promise<DatabaseCentreSpaceDTO[]> {
    const activeConnection =
      await this.databaseConnectionService.getActiveConnectionOrThrow(
        workspaceId,
      );

    return this.cached(activeConnection, workspaceId, 'bases', [], async () => {
      const bases = await this.cyberneticsDataCentreClientService.listBases(
        activeConnection.credentials,
        workspaceId,
      );

      const spaceNameById = await this.loadSpaceNames(
        activeConnection,
        workspaceId,
      );

      const spacesById = new Map<string, DatabaseCentreSpaceDTO>();

      for (const base of bases) {
        if (!isNonEmptyString(base.id)) {
          continue;
        }

        const spaceId = base.spaceId ?? '';
        const space = spacesById.get(spaceId) ?? {
          id: spaceId,
          name: spaceNameById.get(spaceId) ?? '',
          bases: [],
        };

        space.bases.push({
          id: base.id,
          name: base.name ?? '',
          icon: base.icon ?? null,
        });
        spacesById.set(spaceId, space);
      }

      return Array.from(spacesById.values());
    });
  }

  async listTables(
    workspaceId: string,
    baseId: string,
  ): Promise<DatabaseCentreTableDTO[]> {
    const activeConnection =
      await this.databaseConnectionService.getActiveConnectionOrThrow(
        workspaceId,
      );

    return this.cached(
      activeConnection,
      workspaceId,
      'tables',
      [baseId],
      async () => {
        const tables = await this.cyberneticsDataCentreClientService.listTables(
          activeConnection.credentials,
          workspaceId,
          baseId,
        );

        return tables
          .filter((table) => isNonEmptyString(table.id))
          .map((table) => this.shapeTable(table));
      },
    );
  }

  async getTableSchema(
    workspaceId: string,
    baseId: string,
    tableId: string,
    viewId?: string | null,
  ): Promise<DatabaseCentreTableSchemaDTO> {
    const activeConnection =
      await this.databaseConnectionService.getActiveConnectionOrThrow(
        workspaceId,
      );

    return this.getTableSchemaForConnection(
      activeConnection,
      workspaceId,
      baseId,
      tableId,
      viewId,
    );
  }

  async queryRecords(
    workspaceId: string,
    input: DatabaseCentreRecordsQueryInput,
  ): Promise<DatabaseCentreRecordPageDTO> {
    const activeConnection =
      await this.databaseConnectionService.getActiveConnectionOrThrow(
        workspaceId,
      );

    // Also validates that the table belongs to the base, and limits the
    // projection to fields the view exposes
    const schema = await this.getTableSchemaForConnection(
      activeConnection,
      workspaceId,
      input.baseId,
      input.tableId,
      input.viewId,
    );

    const query = {
      viewId: input.viewId,
      search: input.search,
      searchFieldId: input.searchFieldId,
    };

    const [records, totalCount] = await Promise.all([
      this.cyberneticsDataCentreClientService.listRecords(
        activeConnection.credentials,
        workspaceId,
        input.tableId,
        {
          ...query,
          take: input.take,
          skip: input.skip,
          orderBy: input.orderBy,
          projection: schema.fields.map((field) => field.id),
          cellFormat: 'text',
        },
      ),
      this.cyberneticsDataCentreClientService.countRecords(
        activeConnection.credentials,
        workspaceId,
        input.tableId,
        query,
      ),
    ]);

    return {
      records: records.map((record) => this.shapeRecord(record)),
      take: input.take,
      skip: input.skip,
      totalCount,
    };
  }

  async getRecordDetail(
    workspaceId: string,
    baseId: string,
    tableId: string,
    recordId: string,
  ): Promise<DatabaseCentreRecordDetailDTO> {
    const activeConnection =
      await this.databaseConnectionService.getActiveConnectionOrThrow(
        workspaceId,
      );

    const schema = await this.getTableSchemaForConnection(
      activeConnection,
      workspaceId,
      baseId,
      tableId,
    );

    const record = await this.cyberneticsDataCentreClientService.getRecord(
      activeConnection.credentials,
      workspaceId,
      tableId,
      recordId,
      { cellFormat: 'text' },
    );

    return {
      record: this.shapeRecord(record),
      fields: schema.fields,
      deepLink: buildDatabaseCentreDeepLink({
        baseUrl: activeConnection.credentials.baseUrl,
        baseId,
        tableId,
        recordId,
      }),
    };
  }

  async getBaseForConnection(
    activeConnection: ActiveDatabaseConnection,
    workspaceId: string,
    baseId: string,
  ): Promise<DataCentreApiBase> {
    return this.cached(activeConnection, workspaceId, 'base', [baseId], () =>
      this.cyberneticsDataCentreClientService.getBase(
        activeConnection.credentials,
        workspaceId,
        baseId,
      ),
    );
  }

  async getTableForConnection(
    activeConnection: ActiveDatabaseConnection,
    workspaceId: string,
    baseId: string,
    tableId: string,
  ): Promise<DataCentreApiTable> {
    return this.cached(
      activeConnection,
      workspaceId,
      'table',
      [baseId, tableId],
      () =>
        this.cyberneticsDataCentreClientService.getTable(
          activeConnection.credentials,
          workspaceId,
          baseId,
          tableId,
        ),
    );
  }

  async getTableSchemaForConnection(
    activeConnection: ActiveDatabaseConnection,
    workspaceId: string,
    baseId: string,
    tableId: string,
    viewId?: string | null,
  ): Promise<DatabaseCentreTableSchemaDTO> {
    // Rejects a table id that doesn't belong to baseId before loading its schema
    await this.getTableForConnection(
      activeConnection,
      workspaceId,
      baseId,
      tableId,
    );

    return this.cached(
      activeConnection,
      workspaceId,
      'schema',
      [tableId, viewId ?? ''],
      async () => {
        const [fields, views] = await Promise.all([
          this.cyberneticsDataCentreClientService.listFields(
            activeConnection.credentials,
            workspaceId,
            tableId,
            viewId,
          ),
          this.cyberneticsDataCentreClientService.listViews(
            activeConnection.credentials,
            workspaceId,
            tableId,
          ),
        ]);

        return {
          fields: fields
            .filter((field) => isNonEmptyString(field.id))
            .map((field) => this.shapeField(field)),
          views: views
            .filter((view) => isNonEmptyString(view.id))
            .map((view) => ({
              id: view.id ?? '',
              name: view.name ?? '',
              type: view.type ?? null,
            })),
        };
      },
    );
  }

  // Space names are cosmetic; tokens without the space scope still get their bases
  private async loadSpaceNames(
    activeConnection: ActiveDatabaseConnection,
    workspaceId: string,
  ): Promise<Map<string, string>> {
    try {
      const spaces = await this.cyberneticsDataCentreClientService.listSpaces(
        activeConnection.credentials,
        workspaceId,
      );

      return new Map(
        spaces
          .filter((space) => isNonEmptyString(space.id))
          .map((space) => [space.id ?? '', space.name ?? '']),
      );
    } catch (error) {
      if (
        error instanceof DatabaseCentreException &&
        (error.code === DatabaseCentreExceptionCode.UPSTREAM_FORBIDDEN ||
          error.code === DatabaseCentreExceptionCode.UPSTREAM_NOT_FOUND)
      ) {
        return new Map();
      }

      throw error;
    }
  }

  private shapeTable(table: DataCentreApiTable): DatabaseCentreTableDTO {
    return {
      id: table.id ?? '',
      name: table.name ?? '',
      icon: table.icon ?? null,
      description: table.description ?? null,
      defaultViewId: table.defaultViewId ?? null,
    };
  }

  private shapeField(field: DataCentreApiField): DatabaseCentreFieldDTO {
    return {
      id: field.id ?? '',
      name: field.name ?? '',
      type: field.type ?? '',
      isPrimary: field.isPrimary === true,
      isLookup: field.isLookup === true,
      isMultipleCellValue: field.isMultipleCellValue === true,
      cellValueType: field.cellValueType ?? null,
    };
  }

  private shapeRecord(record: DataCentreApiRecord): DatabaseCentreRecordDTO {
    return {
      id: record.id ?? '',
      name: record.name ?? '',
      fields: record.fields ?? {},
      createdTime: record.createdTime ?? null,
      lastModifiedTime: record.lastModifiedTime ?? null,
    };
  }

  // Keys include a hash of the base URL and token fingerprint so that
  // re-pointing or re-keying the connection invalidates cached entries
  private async cached<TValue>(
    { connection }: ActiveDatabaseConnection,
    workspaceId: string,
    kind: CacheKind,
    keyParts: string[],
    load: () => Promise<TValue>,
  ): Promise<TValue> {
    const credentialNamespace = createHash('sha256')
      .update(`${connection.baseUrl}|${connection.tokenFingerprint ?? ''}`)
      .digest('hex')
      .slice(0, 16);

    const cacheKey = [
      workspaceId,
      connection.id,
      credentialNamespace,
      kind,
      ...keyParts.map((part) => encodeURIComponent(part)),
    ].join(':');

    const cachedValue = await this.cacheStorageService.get<TValue>(cacheKey);

    if (isDefined(cachedValue)) {
      return cachedValue;
    }

    const value = await load();

    await this.cacheStorageService.set(
      cacheKey,
      value,
      DATABASE_CENTRE_CACHE_TTL_SECONDS[kind] * 1000,
    );

    return value;
  }
}
