// Normalizes per-message IMAP import errors into a classified exception.
import { Injectable, Logger } from '@nestjs/common';

import { parseImapMessagesImportError } from 'src/modules/messaging/message-import-manager/drivers/imap/utils/parse-imap-messages-import-error.util';

@Injectable()
export class ImapMessagesImportErrorHandler {
  private readonly logger = new Logger(ImapMessagesImportErrorHandler.name);

  // Logs the error, then throws it parsed into a classified exception.
  public handleError(error: Error, messageExternalId: string): void {
    this.logger.error(
      `IMAP: Error importing message ${messageExternalId}: ${JSON.stringify(error)}`,
    );
    throw parseImapMessagesImportError(error, messageExternalId, {
      cause: error,
    });
  }
}
