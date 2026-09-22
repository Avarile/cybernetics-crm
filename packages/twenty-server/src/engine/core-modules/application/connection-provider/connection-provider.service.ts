// Resolves an OAuth connection provider's client id/secret from its
// application registration's encrypted variables, and looks up connection
// providers by id, name, or application.
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { isDefined } from 'twenty-shared/utils';
import { In, Repository } from 'typeorm';

import { ApplicationRegistrationVariableEntity } from 'src/engine/core-modules/application/application-registration-variable/application-registration-variable.entity';
import { ApplicationEntity } from 'src/engine/core-modules/application/application.entity';
import { ConnectionProviderExceptionCode } from 'src/engine/core-modules/application/connection-provider/connection-provider-exception-code.enum';
import { ConnectionProviderEntity } from 'src/engine/core-modules/application/connection-provider/connection-provider.entity';
import { ConnectionProviderException } from 'src/engine/core-modules/application/connection-provider/connection-provider.exception';
import { assertOAuthProvider } from 'src/engine/core-modules/application/connection-provider/utils/assert-oauth-provider.util';
import { SecretEncryptionService } from 'src/engine/core-modules/secret-encryption/secret-encryption.service';

@Injectable()
export class ConnectionProviderService {
  constructor(
    @InjectRepository(ConnectionProviderEntity)
    private readonly connectionProviderRepository: Repository<ConnectionProviderEntity>,
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepository: Repository<ApplicationEntity>,
    @InjectRepository(ApplicationRegistrationVariableEntity)
    private readonly registrationVariableRepository: Repository<ApplicationRegistrationVariableEntity>,
    private readonly secretEncryptionService: SecretEncryptionService,
  ) {}

  // Decrypts and returns an OAuth provider's client id/secret from its
  // application registration's variables, throwing if either is unset.
  async getClientCredentials(
    provider: ConnectionProviderEntity,
  ): Promise<{ clientId: string; clientSecret: string }> {
    assertOAuthProvider(provider);

    const application = await this.applicationRepository.findOneBy({
      id: provider.applicationId,
    });

    if (!isDefined(application?.applicationRegistrationId)) {
      throw new ConnectionProviderException(
        `Application ${provider.applicationId} has no registration; OAuth client credentials cannot be resolved`,
        ConnectionProviderExceptionCode.CLIENT_CREDENTIALS_NOT_CONFIGURED,
      );
    }

    const { clientIdVariable, clientSecretVariable } = provider.oauthConfig;

    const variables = await this.registrationVariableRepository.find({
      where: {
        applicationRegistrationId: application.applicationRegistrationId,
        key: In([clientIdVariable, clientSecretVariable]),
      },
    });

    const valuesByKey = new Map(
      variables.map((v) => [
        v.key,
        v.encryptedValue !== ''
          ? this.secretEncryptionService.decryptVersionedOrThrow(
              v.encryptedValue,
            )
          : '',
      ]),
    );

    const clientId = valuesByKey.get(clientIdVariable) ?? '';
    const clientSecret = valuesByKey.get(clientSecretVariable) ?? '';

    if (!clientId || !clientSecret) {
      throw new ConnectionProviderException(
        `OAuth client credentials are not configured for provider "${provider.name}". The server administrator needs to fill in "${clientIdVariable}" and "${clientSecretVariable}" on the application registration.`,
        ConnectionProviderExceptionCode.CLIENT_CREDENTIALS_NOT_CONFIGURED,
      );
    }

    return { clientId, clientSecret };
  }

  // Returns whether a single OAuth provider's client credentials are set.
  async areClientCredentialsConfigured(
    provider: ConnectionProviderEntity,
  ): Promise<boolean> {
    const result = await this.areClientCredentialsConfiguredBatch([provider]);

    return result.get(provider.id) ?? false;
  }

  // Batch-checks whether each provider's OAuth client id/secret variables
  // are both filled, without decrypting their values.
  async areClientCredentialsConfiguredBatch(
    providers: ConnectionProviderEntity[],
  ): Promise<Map<string, boolean>> {
    const result = new Map<string, boolean>();

    if (providers.length === 0) {
      return result;
    }

    const oauthProviders = providers.filter(
      (p) => p.type === 'oauth' && isDefined(p.oauthConfig),
    );

    for (const provider of providers) {
      result.set(provider.id, false);
    }

    if (oauthProviders.length === 0) {
      return result;
    }

    const applicationIds = [
      ...new Set(oauthProviders.map((p) => p.applicationId)),
    ];
    const applications = await this.applicationRepository.find({
      where: { id: In(applicationIds) },
    });
    const registrationIdByApplicationId = new Map(
      applications.map((app) => [app.id, app.applicationRegistrationId]),
    );

    const registrationIds = [
      ...new Set(
        applications
          .map((app) => app.applicationRegistrationId)
          .filter(isDefined),
      ),
    ];

    if (registrationIds.length === 0) {
      return result;
    }

    const allKeys = oauthProviders.flatMap((p) => [
      p.oauthConfig!.clientIdVariable,
      p.oauthConfig!.clientSecretVariable,
    ]);
    const variables = await this.registrationVariableRepository.find({
      where: {
        applicationRegistrationId: In(registrationIds),
        key: In(allKeys),
      },
    });

    const filledKeysByRegistrationId = new Map<string, Set<string>>();

    for (const variable of variables) {
      if (variable.encryptedValue === '') continue;
      const set =
        filledKeysByRegistrationId.get(variable.applicationRegistrationId) ??
        new Set<string>();

      set.add(variable.key);
      filledKeysByRegistrationId.set(variable.applicationRegistrationId, set);
    }

    for (const provider of oauthProviders) {
      const registrationId = registrationIdByApplicationId.get(
        provider.applicationId,
      );

      if (!isDefined(registrationId)) {
        continue;
      }

      const filled = filledKeysByRegistrationId.get(registrationId);
      const { clientIdVariable, clientSecretVariable } = provider.oauthConfig!;

      result.set(
        provider.id,
        filled?.has(clientIdVariable) === true &&
          filled?.has(clientSecretVariable) === true,
      );
    }

    return result;
  }

  // Looks up a connection provider by application id and name.
  async findOneByApplicationAndName({
    applicationId,
    name,
  }: {
    applicationId: string;
    name: string;
  }): Promise<ConnectionProviderEntity | null> {
    return this.connectionProviderRepository.findOne({
      where: { applicationId, name },
    });
  }

  // Looks up a connection provider by id, throwing if not found.
  async findOneByIdOrThrow(id: string): Promise<ConnectionProviderEntity> {
    const provider = await this.connectionProviderRepository.findOne({
      where: { id },
    });

    if (!isDefined(provider)) {
      throw new ConnectionProviderException(
        `Connection provider with id "${id}" not found`,
        ConnectionProviderExceptionCode.PROVIDER_NOT_FOUND,
      );
    }

    return provider;
  }

  // Returns all connection providers declared by an application, scoped
  // to a workspace.
  async findManyByApplication({
    applicationId,
    workspaceId,
  }: {
    applicationId: string;
    workspaceId: string;
  }): Promise<ConnectionProviderEntity[]> {
    return this.connectionProviderRepository.find({
      where: { applicationId, workspaceId },
    });
  }
}
