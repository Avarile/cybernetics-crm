import { type SecureHttpClientService } from 'src/engine/core-modules/secure-http-client/secure-http-client.service';
import { type ThrottlerService } from 'src/engine/core-modules/throttler/throttler.service';
import { CyberneticsDataCentreClientService } from 'src/modules/database-record/client/cybernetics-data-centre-client.service';
import { DATABASE_CENTRE_MAX_RESPONSE_BYTES } from 'src/modules/database-record/constants/database-centre.constants';
import { DatabaseCentreExceptionCode } from 'src/modules/database-record/exceptions/database-centre.exception';

const CREDENTIALS = {
  baseUrl: 'https://data.example.com',
  apiToken: 'secret-token',
};

const WORKSPACE_ID = 'workspace-id';

const buildService = (response: { status: number; data?: unknown }) => {
  const get = jest.fn().mockResolvedValue(response);

  const secureHttpClientService = {
    getHttpClient: jest.fn().mockReturnValue({ get }),
    getValidatedHost: jest.fn().mockResolvedValue('1.2.3.4'),
  } as unknown as SecureHttpClientService;

  const throttlerService = {
    tokenBucketThrottleOrThrow: jest.fn().mockResolvedValue(1),
  } as unknown as ThrottlerService;

  return {
    service: new CyberneticsDataCentreClientService(
      secureHttpClientService,
      throttlerService,
    ),
    throttlerService,
    secureHttpClientService,
    get,
  };
};

describe('CyberneticsDataCentreClientService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate the host and use a hardened client for every request', async () => {
    const { service, secureHttpClientService, get } = buildService({
      status: 200,
      data: [{ id: 'base-1' }],
    });

    const bases = await service.listBases(CREDENTIALS, WORKSPACE_ID);

    expect(bases).toEqual([{ id: 'base-1' }]);
    expect(secureHttpClientService.getValidatedHost).toHaveBeenCalledWith(
      CREDENTIALS.baseUrl,
    );
    expect(secureHttpClientService.getHttpClient).toHaveBeenCalledWith(
      expect.objectContaining({
        maxRedirects: 0,
        maxContentLength: DATABASE_CENTRE_MAX_RESPONSE_BYTES,
      }),
      { workspaceId: WORKSPACE_ID, source: 'database-centre' },
    );
    expect(get).toHaveBeenCalledWith(
      'https://data.example.com/api/base/access/all',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer secret-token',
        }),
      }),
    );
  });

  it('should serialize record queries the way the Teable API expects', async () => {
    const { service, get } = buildService({
      status: 200,
      data: { records: [] },
    });

    await service.listRecords(CREDENTIALS, WORKSPACE_ID, 'tbl/1', {
      take: 500,
      skip: 20,
      viewId: 'viw1',
      search: 'acme',
      projection: ['fld1', 'fld2'],
    });

    const url = new URL(get.mock.calls[0][0]);

    expect(url.pathname).toBe('/api/table/tbl%2F1/record');
    expect(url.searchParams.get('take')).toBe('200');
    expect(url.searchParams.get('skip')).toBe('20');
    expect(url.searchParams.get('viewId')).toBe('viw1');
    expect(url.searchParams.getAll('search[]')).toEqual(['acme', '', 'true']);
    expect(url.searchParams.getAll('projection[]')).toEqual(['fld1', 'fld2']);
  });

  it.each([
    [401, DatabaseCentreExceptionCode.UPSTREAM_UNAUTHORIZED],
    [403, DatabaseCentreExceptionCode.UPSTREAM_FORBIDDEN],
    [404, DatabaseCentreExceptionCode.UPSTREAM_NOT_FOUND],
    [422, DatabaseCentreExceptionCode.UPSTREAM_BAD_REQUEST],
    [429, DatabaseCentreExceptionCode.UPSTREAM_RATE_LIMITED],
    [500, DatabaseCentreExceptionCode.UPSTREAM_UNREACHABLE],
    [302, DatabaseCentreExceptionCode.UPSTREAM_UNREACHABLE],
  ])(
    'should map an upstream %s response to %s',
    async (status, expectedCode) => {
      const { service } = buildService({
        status,
        data: { message: 'nope' },
      });

      await expect(
        service.getRecord(CREDENTIALS, WORKSPACE_ID, 'tbl1', 'rec1'),
      ).rejects.toMatchObject({ code: expectedCode });
    },
  );

  it('should map transport failures to UPSTREAM_UNREACHABLE', async () => {
    const { service, get } = buildService({ status: 200 });

    get.mockRejectedValueOnce(new Error('socket hang up'));

    await expect(
      service.listSpaces(CREDENTIALS, WORKSPACE_ID),
    ).rejects.toMatchObject({
      code: DatabaseCentreExceptionCode.UPSTREAM_UNREACHABLE,
    });
  });

  it('should reject malformed list payloads', async () => {
    const { service } = buildService({ status: 200, data: { not: 'a list' } });

    await expect(
      service.listTables(CREDENTIALS, WORKSPACE_ID, 'base-1'),
    ).rejects.toMatchObject({
      code: DatabaseCentreExceptionCode.UPSTREAM_UNREACHABLE,
    });
  });

  it('should map an exhausted request budget to UPSTREAM_RATE_LIMITED', async () => {
    const { service, throttlerService, get } = buildService({ status: 200 });

    jest
      .mocked(throttlerService.tokenBucketThrottleOrThrow)
      .mockRejectedValueOnce(new Error('Limit reached'));

    await expect(
      service.listSpaces(CREDENTIALS, WORKSPACE_ID),
    ).rejects.toMatchObject({
      code: DatabaseCentreExceptionCode.UPSTREAM_RATE_LIMITED,
    });
    expect(get).not.toHaveBeenCalled();
  });

  it('should refuse hosts rejected by SSRF validation', async () => {
    const { service, secureHttpClientService, get } = buildService({
      status: 200,
    });

    jest
      .mocked(secureHttpClientService.getValidatedHost)
      .mockRejectedValueOnce(new Error('private IP'));

    await expect(
      service.listSpaces(CREDENTIALS, WORKSPACE_ID),
    ).rejects.toMatchObject({
      code: DatabaseCentreExceptionCode.INVALID_BASE_URL,
    });
    expect(get).not.toHaveBeenCalled();
  });
});
