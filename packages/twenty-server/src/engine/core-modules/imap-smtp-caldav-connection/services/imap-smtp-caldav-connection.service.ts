// Service that test-connects to IMAP/SMTP/CALDAV servers with user-supplied
// credentials and validates+tests a full set of protocol connection params
// before they are saved.
import { Injectable, Logger } from '@nestjs/common';

import { msg } from '@lingui/core/macro';
import { ImapFlow } from 'imapflow';
import { createTransport } from 'nodemailer';
import { isNonEmptyString } from '@sniptt/guards';
import { ACCOUNT_TYPES } from 'twenty-shared/constants';
import { assertUnreachable, isDefined } from 'twenty-shared/utils';

import { UserInputError } from 'src/engine/core-modules/graphql/utils/graphql-errors.util';
import { type EmailAccountConnectionParametersInput } from 'src/engine/core-modules/imap-smtp-caldav-connection/dtos/imap-smtp-caldav-connection.input';
import { ImapSmtpCaldavValidatorService } from 'src/engine/core-modules/imap-smtp-caldav-connection/services/imap-smtp-caldav-connection-validator.service';
import {
  type AccountType,
  type ConnectionParameters,
  type PlaintextImapSmtpCaldavParams,
} from 'src/engine/core-modules/imap-smtp-caldav-connection/types/imap-smtp-caldav-connection.type';
import { buildImapTlsOptions } from 'src/engine/core-modules/imap-smtp-caldav-connection/utils/build-imap-tls-options.util';
import { buildSmtpTlsOptions } from 'src/engine/core-modules/imap-smtp-caldav-connection/utils/build-smtp-tls-options.util';
import { SecureHttpClientService } from 'src/engine/core-modules/secure-http-client/secure-http-client.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { CalDavClientService } from 'src/modules/calendar/calendar-event-import-manager/drivers/caldav/services/caldav-client.service';
import { CalDavFetchEventsService } from 'src/modules/calendar/calendar-event-import-manager/drivers/caldav/services/caldav-fetch-events.service';

@Injectable()
export class ImapSmtpCaldavService {
  private readonly logger = new Logger(ImapSmtpCaldavService.name);

  constructor(
    private readonly secureHttpClientService: SecureHttpClientService,
    private readonly twentyConfigService: TwentyConfigService,
    private readonly caldavClientService: CalDavClientService,
    private readonly caldavFetchEventsService: CalDavFetchEventsService,
    private readonly imapSmtpCaldavValidatorService: ImapSmtpCaldavValidatorService,
  ) {}

  // Attempts to log into the IMAP server with the given credentials and list
  // mailboxes, translating common failures into user-friendly errors.
  async testImapConnection(
    handle: string,
    params: ConnectionParameters,
  ): Promise<boolean> {
    const validatedHost = await this.secureHttpClientService.getValidatedHost(
      params.host,
    );
    const client = new ImapFlow({
      host: validatedHost,
      port: params.port,
      ...buildImapTlsOptions(params.connectionSecurity),
      auth: {
        user: params.username ?? handle,
        pass: params.password,
      },
      logger: false,
      tls: {
        rejectUnauthorized: false,
      },
    });

    // ImapFlow is EventEmitter — missing 'error' listener crashes process on socket timeout.
    client.on('error', (error) => {
      this.logger.error(
        `IMAP test connection error for ${handle}: ${error.message}`,
        error.stack,
      );
    });

    try {
      await client.connect();

      const mailboxes = await client.list();

      this.logger.log(
        `IMAP connection successful. Found ${mailboxes.length} mailboxes.`,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `IMAP connection failed: ${error.message}`,
        error.stack,
      );

      if (error.authenticationFailed) {
        throw new UserInputError(
          'IMAP authentication failed. Please check your credentials.',
          {
            userFriendlyMessage: msg`We couldn't log in to your email account. Please check your email address and password, then try again.`,
          },
        );
      }

      if (error.code === 'ECONNREFUSED') {
        throw new UserInputError(
          `IMAP connection refused. Please verify server and port.`,
          {
            userFriendlyMessage: msg`We couldn't connect to your email server. Please check your server settings and try again.`,
          },
        );
      }

      throw new UserInputError(`IMAP connection failed: ${error.message}`, {
        userFriendlyMessage: msg`We encountered an issue connecting to your email account. Please check your settings and try again.`,
      });
    } finally {
      if (client.authenticated) {
        await client.logout();
      }
    }
  }

  // Verifies SMTP credentials/connectivity via nodemailer's transport.verify().
  async testSmtpConnection(
    handle: string,
    params: ConnectionParameters,
  ): Promise<boolean> {
    const validatedHost = await this.secureHttpClientService.getValidatedHost(
      params.host,
    );
    const transport = createTransport({
      host: validatedHost,
      port: params.port,
      ...buildSmtpTlsOptions(params.connectionSecurity),
      auth: {
        user: params.username ?? handle,
        pass: params.password,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    try {
      await transport.verify();
    } catch (error) {
      this.logger.error(
        `SMTP connection failed: ${error.message}`,
        error.stack,
      );
      throw new UserInputError(`SMTP connection failed: ${error.message}`, {
        userFriendlyMessage: msg`We couldn't connect to your outgoing email server. Please check your SMTP settings and try again.`,
      });
    }

    return true;
  }

  // Connects to the CalDAV server and verifies it exposes at least one
  // calendar supporting events.
  async testCaldavConnection(
    handle: string,
    params: ConnectionParameters,
  ): Promise<boolean> {
    try {
      const client = await this.caldavClientService.getClient({
        serverUrl: params.host,
        username: params.username ?? handle,
        password: params.password,
      });

      const calendars =
        await this.caldavFetchEventsService.listEventCalendars(client);

      if (calendars.length === 0) {
        throw new UserInputError('No calendar with event support found', {
          userFriendlyMessage: msg`We couldn't find any calendars on your CalDAV server. Please make sure your account has at least one calendar.`,
        });
      }
    } catch (error) {
      if (error instanceof UserInputError) {
        throw error;
      }

      this.logger.error(
        `CALDAV connection failed: ${error.message}`,
        error.stack,
      );

      if (error.code === 'FailedToOpenSocket') {
        throw new UserInputError(`CALDAV connection failed: ${error.message}`, {
          userFriendlyMessage: msg`We couldn't connect to your CalDAV server. Please check your server settings and try again.`,
        });
      }

      throw new UserInputError(`CALDAV connection failed: ${error.message}`, {
        userFriendlyMessage: msg`Invalid CALDAV credentials. Please check your username and password.`,
      });
    }

    return true;
  }

  // Dispatches to the right protocol-specific connection test, unless
  // connection testing is disabled by config.
  async testImapSmtpCaldav({
    handle,
    params,
    accountType,
  }: {
    handle: string;
    params: ConnectionParameters;
    accountType: AccountType;
  }): Promise<boolean> {
    if (
      !this.twentyConfigService.get(
        'IS_IMAP_SMTP_CALDAV_CONNECTION_TEST_ENABLED',
      )
    ) {
      return true;
    }

    switch (accountType) {
      case 'IMAP':
        return this.testImapConnection(handle, params);
      case 'SMTP':
        return this.testSmtpConnection(handle, params);
      case 'CALDAV':
        return this.testCaldavConnection(handle, params);
      default:
        assertUnreachable(accountType);
    }
  }

  // Validates each supplied protocol's params (merging in existing values
  // where needed) and connection-tests each one before returning the full
  // validated parameter set to persist.
  async validateAndTestConnectionParameters({
    connectionParameters,
    handle,
    existingConnectionParameters,
  }: {
    connectionParameters: EmailAccountConnectionParametersInput;
    handle: string;
    existingConnectionParameters: PlaintextImapSmtpCaldavParams | null;
  }): Promise<PlaintextImapSmtpCaldavParams> {
    const validatedParams: PlaintextImapSmtpCaldavParams = {};

    if (isDefined(connectionParameters.name)) {
      const trimmedName = connectionParameters.name.trim();

      validatedParams.name = isNonEmptyString(trimmedName) ? trimmedName : null;
    } else if (isDefined(existingConnectionParameters?.name)) {
      validatedParams.name = existingConnectionParameters.name;
    }

    for (const protocol of ACCOUNT_TYPES) {
      const params = connectionParameters[protocol];

      if (params) {
        const existingProtocolParams =
          existingConnectionParameters?.[protocol] ?? null;

        const validatedProtocolParams =
          await this.imapSmtpCaldavValidatorService.validateProtocolConnectionParams(
            {
              params,
              existingProtocolParams,
            },
          );

        await this.testImapSmtpCaldav({
          handle,
          params: validatedProtocolParams,
          accountType: protocol,
        });

        validatedParams[protocol] = validatedProtocolParams;
      }
    }

    return validatedParams;
  }
}
