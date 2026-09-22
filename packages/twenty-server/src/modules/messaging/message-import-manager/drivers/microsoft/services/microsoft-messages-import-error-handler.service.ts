// Normalizes Microsoft Graph message import errors into a classified
// exception, checking for a temporary network error first.
import { Injectable, Logger } from '@nestjs/common';

import { MicrosoftNetworkErrorHandler } from 'src/modules/messaging/message-import-manager/drivers/microsoft/services/microsoft-network-error-handler.service';
import { parseMicrosoftMessagesImportError } from 'src/modules/messaging/message-import-manager/drivers/microsoft/utils/parse-microsoft-messages-import.util';

@Injectable()
export class MicrosoftMessagesImportErrorHandler {
  private readonly logger = new Logger(
    MicrosoftMessagesImportErrorHandler.name,
  );

  constructor(
    private readonly microsoftNetworkErrorHandler: MicrosoftNetworkErrorHandler,
  ) {}

  // oxlint-disable-next-line typescript/no-explicit-any
  // Logs the error, then throws a temporary-network error if recognized,
  // otherwise a parsed classified exception.
  public handleError(error: any): void {
    this.logger.error(`Error fetching messages: ${JSON.stringify(error)}`);

    const networkError = this.microsoftNetworkErrorHandler.handleError(error);

    if (networkError) {
      throw networkError;
    }

    throw parseMicrosoftMessagesImportError(error, { cause: error });
  }
}
