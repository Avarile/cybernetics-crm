import { Injectable, Logger } from '@nestjs/common';

import { isAxiosError } from 'axios';
import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

import { SecureHttpClientService } from 'src/engine/core-modules/secure-http-client/secure-http-client.service';
import { ThrottlerService } from 'src/engine/core-modules/throttler/throttler.service';
import {
  type DataCentreApiBase,
  type DataCentreApiField,
  type DataCentreApiRecord,
  type DataCentreApiRecordList,
  type DataCentreApiRowCount,
  type DataCentreApiSpace,
  type DataCentreApiTable,
  type DataCentreApiView,
  type DataCentreConnectionCredentials,
  type DataCentreRecordQuery,
} from 'src/modules/database-record/client/types/cybernetics-data-centre-api.types';
import {
  DATABASE_CENTRE_MAX_ERROR_MESSAGE_LENGTH,
  DATABASE_CENTRE_MAX_RECORDS_PAGE_SIZE,
  DATABASE_CENTRE_MAX_RESPONSE_BYTES,
  DATABASE_CENTRE_RATE_LIMIT_MAX_REQUESTS,
  DATABASE_CENTRE_RATE_LIMIT_WINDOW_MS,
  DATABASE_CENTRE_REQUEST_TIMEOUT_MS,
} from 'src/modules/database-record/constants/database-centre.constants';
import {
  DatabaseCentreException,
  DatabaseCentreExceptionCode,
} from 'src/modules/database-record/exceptions/database-centre.exception';

type QueryParameters = [string, string][];

const EXCEPTION_CODE_BY_UPSTREAM_STATUS: Record<
  number,
  DatabaseCentreExceptionCode
> = {
  400: DatabaseCentreExceptionCode.UPSTREAM_BAD_REQUEST,
  401: DatabaseCentreExceptionCode.UPSTREAM_UNAUTHORIZED,
  403: DatabaseCentreExceptionCode.UPSTREAM_FORBIDDEN,
  404: DatabaseCentreExceptionCode.UPSTREAM_NOT_FOUND,
  422: DatabaseCentreExceptionCode.UPSTREAM_BAD_REQUEST,
  429: DatabaseCentreExceptionCode.UPSTREAM_RATE_LIMITED,
};

// Read-only client for the cybernetics-data-centre (Teable-compatible) REST API.
// Every request goes through the SSRF-safe secure HTTP client, never follows
// redirects (they could point at an internal host) and caps response size.
// Query serialization mirrors @teable/openapi: complex parameters are JSON
// strings and tuple/array parameters use the "name[]" form.
@Injectable()
export class CyberneticsDataCentreClientService {
  private readonly logger = new Logger(CyberneticsDataCentreClientService.name);

  constructor(
    private readonly secureHttpClientService: SecureHttpClientService,
    private readonly throttlerService: ThrottlerService,
  ) {}

  async assertBaseUrlIsAllowed(baseUrl: string): Promise<void> {
    try {
      await this.secureHttpClientService.getValidatedHost(baseUrl);
    } catch (error) {
      throw new DatabaseCentreException(
        `Data centre host is not allowed or could not be resolved: ${baseUrl} (${error instanceof Error ? error.message : 'unknown error'})`,
        DatabaseCentreExceptionCode.INVALID_BASE_URL,
      );
    }
  }

  async listSpaces(
    credentials: DataCentreConnectionCredentials,
    workspaceId: string,
  ): Promise<DataCentreApiSpace[]> {
    return this.expectList(await this.get(credentials, workspaceId, '/space'));
  }

  async listBases(
    credentials: DataCentreConnectionCredentials,
    workspaceId: string,
  ): Promise<DataCentreApiBase[]> {
    return this.expectList(
      await this.get(credentials, workspaceId, '/base/access/all'),
    );
  }

  async getBase(
    credentials: DataCentreConnectionCredentials,
    workspaceId: string,
    baseId: string,
  ): Promise<DataCentreApiBase> {
    return this.expectObject(
      await this.get(credentials, workspaceId, `/base/${segment(baseId)}`),
    );
  }

  async listTables(
    credentials: DataCentreConnectionCredentials,
    workspaceId: string,
    baseId: string,
  ): Promise<DataCentreApiTable[]> {
    return this.expectList(
      await this.get(
        credentials,
        workspaceId,
        `/base/${segment(baseId)}/table`,
      ),
    );
  }

  // Fetching a table through its base also proves the table belongs to it
  async getTable(
    credentials: DataCentreConnectionCredentials,
    workspaceId: string,
    baseId: string,
    tableId: string,
  ): Promise<DataCentreApiTable> {
    return this.expectObject(
      await this.get(
        credentials,
        workspaceId,
        `/base/${segment(baseId)}/table/${segment(tableId)}`,
      ),
    );
  }

  async listFields(
    credentials: DataCentreConnectionCredentials,
    workspaceId: string,
    tableId: string,
    viewId?: string | null,
  ): Promise<DataCentreApiField[]> {
    const parameters: QueryParameters = isNonEmptyString(viewId)
      ? [['viewId', viewId]]
      : [];

    return this.expectList(
      await this.get(
        credentials,
        workspaceId,
        `/table/${segment(tableId)}/field`,
        parameters,
      ),
    );
  }

  async listViews(
    credentials: DataCentreConnectionCredentials,
    workspaceId: string,
    tableId: string,
  ): Promise<DataCentreApiView[]> {
    return this.expectList(
      await this.get(
        credentials,
        workspaceId,
        `/table/${segment(tableId)}/view`,
      ),
    );
  }

  async listRecords(
    credentials: DataCentreConnectionCredentials,
    workspaceId: string,
    tableId: string,
    query: DataCentreRecordQuery,
  ): Promise<DataCentreApiRecord[]> {
    const take = Math.max(
      1,
      Math.min(Math.trunc(query.take), DATABASE_CENTRE_MAX_RECORDS_PAGE_SIZE),
    );

    const parameters: QueryParameters = [
      ...this.buildRecordFilterParameters(query),
      ['take', String(take)],
      ['skip', String(Math.max(0, Math.trunc(query.skip)))],
      ['cellFormat', query.cellFormat ?? 'text'],
    ];

    if (isDefined(query.orderBy) && query.orderBy.length > 0) {
      parameters.push(['orderBy', JSON.stringify(query.orderBy)]);
    }

    for (const fieldId of query.projection ?? []) {
      parameters.push(['projection[]', fieldId]);
    }

    const data = this.expectObject<DataCentreApiRecordList>(
      await this.get(
        credentials,
        workspaceId,
        `/table/${segment(tableId)}/record`,
        parameters,
      ),
    );

    return this.expectList(data.records ?? null);
  }

  async countRecords(
    credentials: DataCentreConnectionCredentials,
    workspaceId: string,
    tableId: string,
    query: Pick<DataCentreRecordQuery, 'viewId' | 'search' | 'searchFieldId'>,
  ): Promise<number> {
    const data = this.expectObject<DataCentreApiRowCount>(
      await this.get(
        credentials,
        workspaceId,
        `/table/${segment(tableId)}/aggregation/row-count`,
        this.buildRecordFilterParameters(query),
      ),
    );

    return Number(data.rowCount ?? 0);
  }

  async getRecord(
    credentials: DataCentreConnectionCredentials,
    workspaceId: string,
    tableId: string,
    recordId: string,
    {
      cellFormat = 'json',
      projection = [],
    }: { cellFormat?: 'text' | 'json'; projection?: string[] } = {},
  ): Promise<DataCentreApiRecord> {
    const parameters: QueryParameters = [
      ['fieldKeyType', 'id'],
      ['cellFormat', cellFormat],
      ...projection.map((fieldId): [string, string] => [
        'projection[]',
        fieldId,
      ]),
    ];

    return this.expectObject(
      await this.get(
        credentials,
        workspaceId,
        `/table/${segment(tableId)}/record/${segment(recordId)}`,
        parameters,
      ),
    );
  }

  private buildRecordFilterParameters(
    query: Pick<DataCentreRecordQuery, 'viewId' | 'search' | 'searchFieldId'>,
  ): QueryParameters {
    const parameters: QueryParameters = [['fieldKeyType', 'id']];

    if (isNonEmptyString(query.viewId)) {
      parameters.push(['viewId', query.viewId]);
    }

    if (isNonEmptyString(query.search)) {
      // Teable's search is a [value, fieldId, hideNotMatchRow] tuple
      parameters.push(['search[]', query.search]);
      parameters.push(['search[]', query.searchFieldId ?? '']);
      parameters.push(['search[]', 'true']);
    }

    return parameters;
  }

  private async get(
    { baseUrl, apiToken }: DataCentreConnectionCredentials,
    workspaceId: string,
    path: string,
    parameters: QueryParameters = [],
  ): Promise<unknown> {
    // The SSRF-safe agent validates the resolved IP on every connection, so
    // the host isn't re-resolved here; it's checked up front when saved
    await this.throttleOrThrow(workspaceId);

    const queryString = new URLSearchParams(parameters).toString();
    const url = `${baseUrl.replace(/\/+$/, '')}/api${path}${queryString.length > 0 ? `?${queryString}` : ''}`;

    const httpClient = this.secureHttpClientService.getHttpClient(
      {
        timeout: DATABASE_CENTRE_REQUEST_TIMEOUT_MS,
        retries: 2,
        maxRedirects: 0,
        maxContentLength: DATABASE_CENTRE_MAX_RESPONSE_BYTES,
        maxBodyLength: DATABASE_CENTRE_MAX_RESPONSE_BYTES,
        validateStatus: () => true,
      },
      { workspaceId, source: 'database-centre' },
    );

    let response;

    try {
      response = await httpClient.get<unknown>(url, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          Accept: 'application/json',
          'User-Agent': 'cybernetics-crm',
        },
        responseType: 'json',
      });
    } catch (error) {
      throw this.mapTransportError(error, path);
    }

    const { status } = response;

    if (status >= 300 && status < 400) {
      throw new DatabaseCentreException(
        `Data centre responded with an unexpected redirect (${status}) for ${path}`,
        DatabaseCentreExceptionCode.UPSTREAM_UNREACHABLE,
      );
    }

    if (status >= 400) {
      throw new DatabaseCentreException(
        `Data centre responded with HTTP ${status} for ${path}: ${extractUpstreamMessage(response.data)}`,
        EXCEPTION_CODE_BY_UPSTREAM_STATUS[status] ??
          DatabaseCentreExceptionCode.UPSTREAM_UNREACHABLE,
      );
    }

    return response.data;
  }

  private async throttleOrThrow(workspaceId: string): Promise<void> {
    try {
      await this.throttlerService.tokenBucketThrottleOrThrow(
        `database-centre:${workspaceId}`,
        1,
        DATABASE_CENTRE_RATE_LIMIT_MAX_REQUESTS,
        DATABASE_CENTRE_RATE_LIMIT_WINDOW_MS,
      );
    } catch {
      throw new DatabaseCentreException(
        `Data centre request limit reached for workspace ${workspaceId}`,
        DatabaseCentreExceptionCode.UPSTREAM_RATE_LIMITED,
      );
    }
  }

  private mapTransportError(
    error: unknown,
    path: string,
  ): DatabaseCentreException {
    const reason = isAxiosError(error)
      ? `${error.code ?? 'UNKNOWN'}: ${error.message}`
      : error instanceof Error
        ? error.message
        : 'unknown error';

    // Never log the request config: it carries the bearer token
    this.logger.warn(`Data centre request to ${path} failed (${reason})`);

    return new DatabaseCentreException(
      `Could not reach the data centre for ${path}: ${reason}`,
      DatabaseCentreExceptionCode.UPSTREAM_UNREACHABLE,
    );
  }

  private expectList<TItem>(data: unknown): TItem[] {
    if (!isDefined(data)) {
      return [];
    }

    if (
      !Array.isArray(data) ||
      !data.every((item) => typeof item === 'object' && item !== null)
    ) {
      throw new DatabaseCentreException(
        'Data centre returned an unexpected list response',
        DatabaseCentreExceptionCode.UPSTREAM_UNREACHABLE,
      );
    }

    return data as TItem[];
  }

  private expectObject<TObject>(data: unknown): TObject {
    if (!isDefined(data)) {
      return {} as TObject;
    }

    if (typeof data !== 'object' || Array.isArray(data)) {
      throw new DatabaseCentreException(
        'Data centre returned an unexpected object response',
        DatabaseCentreExceptionCode.UPSTREAM_UNREACHABLE,
      );
    }

    return data as TObject;
  }
}

const segment = (value: string): string => encodeURIComponent(value);

const extractUpstreamMessage = (data: unknown): string => {
  const message =
    typeof data === 'object' &&
    data !== null &&
    'message' in data &&
    typeof data.message === 'string'
      ? data.message
      : 'no message';

  return message.slice(0, DATABASE_CENTRE_MAX_ERROR_MESSAGE_LENGTH);
};
