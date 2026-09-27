// Subset of the Teable-compatible REST payloads the integration reads.
// Every property is optional because the upstream shape isn't under our control.

export type DataCentreApiSpace = {
  id?: string;
  name?: string;
};

export type DataCentreApiBase = {
  id?: string;
  name?: string;
  icon?: string | null;
  spaceId?: string;
};

export type DataCentreApiTable = {
  id?: string;
  name?: string;
  icon?: string | null;
  description?: string | null;
  defaultViewId?: string | null;
};

export type DataCentreApiFieldChoice = {
  name?: string;
  color?: string;
};

export type DataCentreApiField = {
  id?: string;
  name?: string;
  type?: string;
  isPrimary?: boolean;
  isLookup?: boolean;
  cellValueType?: string;
  isMultipleCellValue?: boolean;
  options?: {
    choices?: DataCentreApiFieldChoice[];
  } | null;
};

export type DataCentreApiView = {
  id?: string;
  name?: string;
  type?: string;
};

export type DataCentreApiRecord = {
  id?: string;
  name?: string;
  fields?: Record<string, unknown>;
  autoNumber?: number;
  createdTime?: string;
  lastModifiedTime?: string;
};

export type DataCentreApiRecordList = {
  records?: DataCentreApiRecord[];
};

export type DataCentreApiRowCount = {
  rowCount?: number;
};

export type DataCentreRecordQuery = {
  take: number;
  skip: number;
  viewId?: string | null;
  search?: string | null;
  searchFieldId?: string | null;
  orderBy?: { fieldId: string; order: 'asc' | 'desc' }[] | null;
  projection?: string[];
  cellFormat?: 'text' | 'json';
};

export type DataCentreConnectionCredentials = {
  baseUrl: string;
  apiToken: string;
};
