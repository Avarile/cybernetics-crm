// Hand-written counterparts of the database-centre GraphQL types, which are
// served by the /metadata schema

export type DatabaseCentreConnection = {
  id: string;
  name: string;
  baseUrl: string;
  tokenFingerprint: string | null;
  isEnabled: boolean;
  lastVerifiedAt: string | null;
  lastVerificationStatus: string;
};

export type DatabaseCentreBase = {
  id: string;
  name: string;
  icon: string | null;
};

export type DatabaseCentreSpace = {
  id: string;
  name: string;
  bases: DatabaseCentreBase[];
};

export type DatabaseCentreTable = {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  defaultViewId: string | null;
};

export type DatabaseCentreField = {
  id: string;
  name: string;
  type: string;
  isPrimary: boolean;
  isLookup: boolean;
  isMultipleCellValue: boolean;
  cellValueType: string | null;
};

export type DatabaseCentreView = {
  id: string;
  name: string;
  type: string | null;
};

export type DatabaseCentreRecord = {
  id: string;
  name: string;
  fields: Record<string, unknown>;
  createdTime: string | null;
  lastModifiedTime: string | null;
};

export type DatabaseCentreRecordPage = {
  records: DatabaseCentreRecord[];
  take: number;
  skip: number;
  totalCount: number | null;
};

export type DatabaseCentreRecordDetail = {
  record: DatabaseCentreRecord;
  fields: DatabaseCentreField[];
  deepLink: string;
};

export type DatabaseCentreSnapshotStatus =
  | 'OK'
  | 'MISSING'
  | 'FORBIDDEN'
  | 'STALE';

// Fields of the databaseRecordTarget workspace object read by the widget
export type DatabaseRecordTarget = {
  __typename: 'DatabaseRecordTarget';
  id: string;
  baseId: string;
  tableId: string;
  recordId: string;
  recordName: string | null;
  baseName: string | null;
  tableName: string | null;
  previewFields: Record<string, string> | null;
  sourceUrl: string | null;
  snapshotStatus: DatabaseCentreSnapshotStatus;
  snapshotAt: string | null;
  createdAt: string;
};
