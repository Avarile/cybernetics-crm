import { type GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type CyberneticsDataCentreClientService } from 'src/modules/database-record/client/cybernetics-data-centre-client.service';
import { DatabaseCentreExceptionCode } from 'src/modules/database-record/exceptions/database-centre.exception';
import { type DatabaseConnectionTokenEncryptionService } from 'src/modules/database-record/services/database-connection-token-encryption.service';
import { DatabaseConnectionService } from 'src/modules/database-record/services/database-connection.service';

const WORKSPACE_ID = 'workspace-id';

const EXISTING_CONNECTION = {
  id: 'connection-id',
  name: 'Data centre',
  baseUrl: 'https://data.example.com',
  encryptedApiToken: 'enc:v2:key:payload',
  tokenFingerprint: '••••abcd',
  isEnabled: true,
  lastVerifiedAt: null,
  lastVerificationStatus: 'OK',
};

const buildService = (existingConnection: object | null) => {
  const repository = {
    findOne: jest
      .fn()
      .mockResolvedValue(existingConnection ?? EXISTING_CONNECTION),
    update: jest.fn(),
    insert: jest.fn(),
  };

  if (existingConnection === null) {
    repository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValue(EXISTING_CONNECTION);
  }

  const globalWorkspaceOrmManager = {
    executeInWorkspaceContext: jest.fn((callback: () => unknown) => callback()),
    getRepository: jest.fn().mockResolvedValue(repository),
  } as unknown as GlobalWorkspaceOrmManager;

  const service = new DatabaseConnectionService(
    globalWorkspaceOrmManager,
    {
      assertBaseUrlIsAllowed: jest.fn(),
    } as unknown as CyberneticsDataCentreClientService,
    {
      encrypt: jest.fn().mockReturnValue('enc:v2:key:new'),
      buildFingerprint: jest.fn().mockReturnValue('••••wxyz'),
    } as unknown as DatabaseConnectionTokenEncryptionService,
  );

  return { service, repository };
};

describe('DatabaseConnectionService.upsertConnection', () => {
  it('should require a token when creating a connection', async () => {
    const { service, repository } = buildService(null);

    await expect(
      service.upsertConnection(WORKSPACE_ID, {
        name: 'Data centre',
        baseUrl: 'https://data.example.com',
        isEnabled: true,
      }),
    ).rejects.toMatchObject({
      code: DatabaseCentreExceptionCode.CONNECTION_NOT_CONFIGURED,
    });
    expect(repository.insert).not.toHaveBeenCalled();
  });

  it('should refuse to move the stored token to a new origin', async () => {
    const { service, repository } = buildService(EXISTING_CONNECTION);

    await expect(
      service.upsertConnection(WORKSPACE_ID, {
        name: 'Data centre',
        baseUrl: 'https://attacker.example',
        isEnabled: true,
      }),
    ).rejects.toMatchObject({
      code: DatabaseCentreExceptionCode.CONNECTION_NOT_CONFIGURED,
    });
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should keep the stored token when only non-credential fields change', async () => {
    const { service, repository } = buildService(EXISTING_CONNECTION);

    await service.upsertConnection(WORKSPACE_ID, {
      name: 'Renamed',
      baseUrl: 'https://data.example.com/api/',
      isEnabled: false,
    });

    expect(repository.update).toHaveBeenCalledWith(
      { id: 'connection-id' },
      {
        name: 'Renamed',
        baseUrl: 'https://data.example.com',
        isEnabled: false,
      },
    );
  });

  it('should re-encrypt and reset verification when the token changes', async () => {
    const { service, repository } = buildService(EXISTING_CONNECTION);

    await service.upsertConnection(WORKSPACE_ID, {
      name: 'Data centre',
      baseUrl: 'https://new.example.com',
      apiToken: 'new-token-wxyz',
      isEnabled: true,
    });

    expect(repository.update).toHaveBeenCalledWith(
      { id: 'connection-id' },
      expect.objectContaining({
        baseUrl: 'https://new.example.com',
        encryptedApiToken: 'enc:v2:key:new',
        tokenFingerprint: '••••wxyz',
        lastVerifiedAt: null,
        lastVerificationStatus: 'UNVERIFIED',
      }),
    );
  });
});
