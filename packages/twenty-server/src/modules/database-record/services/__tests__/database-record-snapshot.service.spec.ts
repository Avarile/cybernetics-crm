import { type CyberneticsDataCentreClientService } from 'src/modules/database-record/client/cybernetics-data-centre-client.service';
import {
  DatabaseCentreException,
  DatabaseCentreExceptionCode,
} from 'src/modules/database-record/exceptions/database-centre.exception';
import { type DatabaseRecordBrowseService } from 'src/modules/database-record/services/database-record-browse.service';
import { type ActiveDatabaseConnection } from 'src/modules/database-record/services/database-connection.service';
import { DatabaseRecordSnapshotService } from 'src/modules/database-record/services/database-record-snapshot.service';

const ACTIVE_CONNECTION = {
  connection: { id: 'connection-id' },
  credentials: { baseUrl: 'https://data.example.com', apiToken: 'token' },
} as unknown as ActiveDatabaseConnection;

const buildField = (
  id: string,
  overrides: Partial<{ isPrimary: boolean; type: string }> = {},
) => ({
  id,
  name: `Field ${id}`,
  type: 'singleLineText',
  isPrimary: false,
  isLookup: false,
  isMultipleCellValue: false,
  cellValueType: 'string',
  ...overrides,
});

describe('DatabaseRecordSnapshotService', () => {
  const getRecord = jest.fn();

  const browseService = {
    getBaseForConnection: jest
      .fn()
      .mockResolvedValue({ name: 'Sales', spaceId: 'space-1' }),
    getTableForConnection: jest.fn().mockResolvedValue({ name: 'Deals' }),
    getTableSchemaForConnection: jest.fn().mockResolvedValue({
      fields: [
        buildField('fldAttachment', { type: 'attachment' }),
        buildField('fldPrimary', { isPrimary: true }),
        buildField('fld1'),
        buildField('fld2'),
        buildField('fld3'),
        buildField('fld4'),
        buildField('fld5'),
      ],
      views: [],
    }),
  } as unknown as DatabaseRecordBrowseService;

  const service = new DatabaseRecordSnapshotService(
    { getRecord } as unknown as CyberneticsDataCentreClientService,
    browseService,
  );

  beforeEach(() => {
    getRecord.mockReset();
  });

  it('should keep the primary field as name and preview up to four other fields', async () => {
    getRecord.mockResolvedValue({
      name: '',
      fields: {
        fldPrimary: 'Big deal',
        fld1: 'one',
        fld2: '',
        fld3: 'three',
        fld4: 'four',
        fld5: 'five',
      },
    });

    const snapshot = await service.buildSnapshot(
      ACTIVE_CONNECTION,
      'workspace-id',
      { baseId: 'base-1', tableId: 'tbl1', recordId: 'rec1' },
    );

    expect(getRecord).toHaveBeenCalledWith(
      ACTIVE_CONNECTION.credentials,
      'workspace-id',
      'tbl1',
      'rec1',
      {
        cellFormat: 'text',
        projection: ['fldPrimary', 'fld1', 'fld2', 'fld3', 'fld4'],
      },
    );
    expect(snapshot).toMatchObject({
      spaceId: 'space-1',
      recordName: 'Big deal',
      baseName: 'Sales',
      tableName: 'Deals',
      previewFields: {
        'Field fld1': 'one',
        'Field fld3': 'three',
        'Field fld4': 'four',
      },
      sourceUrl:
        'https://data.example.com/base/base-1/table/tbl1?recordId=rec1',
      snapshotStatus: 'OK',
    });
  });

  it.each([
    [DatabaseCentreExceptionCode.UPSTREAM_NOT_FOUND, 'MISSING'],
    [DatabaseCentreExceptionCode.UPSTREAM_FORBIDDEN, 'FORBIDDEN'],
  ])('should map a %s refresh failure to %s', (code, expectedStatus) => {
    expect(
      service.getFailedRefreshStatus(
        new DatabaseCentreException('failed', code),
      ),
    ).toBe(expectedStatus);
  });

  it('should rethrow connection-level refresh failures', () => {
    const error = new DatabaseCentreException(
      'down',
      DatabaseCentreExceptionCode.UPSTREAM_UNREACHABLE,
    );

    expect(() => service.getFailedRefreshStatus(error)).toThrow(error);
  });
});
