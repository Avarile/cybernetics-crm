import { Injectable } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

import { CyberneticsDataCentreClientService } from 'src/modules/database-record/client/cybernetics-data-centre-client.service';
import {
  DATABASE_CENTRE_PREVIEW_EXCLUDED_FIELD_TYPES,
  DATABASE_CENTRE_PREVIEW_FIELD_COUNT,
  DATABASE_CENTRE_PREVIEW_VALUE_LENGTH,
} from 'src/modules/database-record/constants/database-centre.constants';
import {
  DatabaseCentreException,
  DatabaseCentreExceptionCode,
} from 'src/modules/database-record/exceptions/database-centre.exception';
import { DatabaseRecordBrowseService } from 'src/modules/database-record/services/database-record-browse.service';
import { type ActiveDatabaseConnection } from 'src/modules/database-record/services/database-connection.service';
import { type DatabaseRecordSnapshotStatus } from 'src/modules/database-record/types/database-centre-status.type';
import { buildDatabaseCentreDeepLink } from 'src/modules/database-record/utils/build-database-centre-deep-link.util';

export type DatabaseRecordSnapshot = {
  spaceId: string;
  baseId: string;
  tableId: string;
  recordId: string;
  viewId: string | null;
  recordName: string;
  baseName: string;
  tableName: string;
  previewFields: Record<string, string>;
  sourceUrl: string;
  snapshotStatus: DatabaseRecordSnapshotStatus;
  snapshotAt: string;
};

export type DatabaseRecordSnapshotLocator = {
  baseId: string;
  tableId: string;
  recordId: string;
  viewId?: string | null;
};

// Builds the denormalized preview stored on a databaseRecordTarget, so the
// record page renders attachments without a live upstream call per render.
// The preview prioritizes the table's primary field, then a few others.
@Injectable()
export class DatabaseRecordSnapshotService {
  constructor(
    private readonly cyberneticsDataCentreClientService: CyberneticsDataCentreClientService,
    private readonly databaseRecordBrowseService: DatabaseRecordBrowseService,
  ) {}

  async buildSnapshot(
    activeConnection: ActiveDatabaseConnection,
    workspaceId: string,
    { baseId, tableId, recordId, viewId }: DatabaseRecordSnapshotLocator,
  ): Promise<DatabaseRecordSnapshot> {
    // The schema lookup fetches (and caches) the table first, so the table
    // read after it is a cache hit rather than a second upstream call
    const [base, schema] = await Promise.all([
      this.databaseRecordBrowseService.getBaseForConnection(
        activeConnection,
        workspaceId,
        baseId,
      ),
      this.databaseRecordBrowseService.getTableSchemaForConnection(
        activeConnection,
        workspaceId,
        baseId,
        tableId,
      ),
    ]);

    const table = await this.databaseRecordBrowseService.getTableForConnection(
      activeConnection,
      workspaceId,
      baseId,
      tableId,
    );

    const primaryField = schema.fields.find((field) => field.isPrimary);
    const previewFields = schema.fields
      .filter(
        (field) =>
          !field.isPrimary &&
          !DATABASE_CENTRE_PREVIEW_EXCLUDED_FIELD_TYPES.includes(field.type),
      )
      .slice(0, DATABASE_CENTRE_PREVIEW_FIELD_COUNT);

    const projection = [primaryField, ...previewFields]
      .filter(isDefined)
      .map((field) => field.id);

    const record = await this.cyberneticsDataCentreClientService.getRecord(
      activeConnection.credentials,
      workspaceId,
      tableId,
      recordId,
      { cellFormat: 'text', projection },
    );

    const values = record.fields ?? {};

    const previewValues: Record<string, string> = {};

    for (const field of previewFields) {
      const value = truncate(values[field.id]);

      if (value.length > 0) {
        previewValues[field.name] = value;
      }
    }

    const recordName = isNonEmptyString(record.name)
      ? record.name
      : isDefined(primaryField)
        ? truncate(values[primaryField.id])
        : '';

    return {
      spaceId: base.spaceId ?? '',
      baseId,
      tableId,
      recordId,
      viewId: viewId ?? null,
      recordName: truncate(recordName),
      baseName: base.name ?? '',
      tableName: table.name ?? '',
      previewFields: previewValues,
      sourceUrl: buildDatabaseCentreDeepLink({
        baseUrl: activeConnection.credentials.baseUrl,
        baseId,
        tableId,
        recordId,
      }),
      snapshotStatus: 'OK',
      snapshotAt: new Date().toISOString(),
    };
  }

  // Maps an upstream failure during a refresh to the status to record on
  // the attachment, or rethrows when it isn't about the record itself
  // (e.g. the whole data centre being unreachable keeps the old snapshot).
  getFailedRefreshStatus(error: unknown): DatabaseRecordSnapshotStatus {
    if (!(error instanceof DatabaseCentreException)) {
      throw error;
    }

    switch (error.code) {
      case DatabaseCentreExceptionCode.UPSTREAM_NOT_FOUND:
        return 'MISSING';
      case DatabaseCentreExceptionCode.UPSTREAM_FORBIDDEN:
        return 'FORBIDDEN';
      default:
        throw error;
    }
  }
}

const truncate = (value: unknown): string => {
  if (!isDefined(value)) {
    return '';
  }

  const text =
    typeof value === 'string'
      ? value
      : typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);

  return text.slice(0, DATABASE_CENTRE_PREVIEW_VALUE_LENGTH);
};
