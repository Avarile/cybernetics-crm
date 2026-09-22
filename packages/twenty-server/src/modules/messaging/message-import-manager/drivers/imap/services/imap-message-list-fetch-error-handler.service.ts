// Normalizes IMAP message-list-fetch errors into a classified exception.
import { Injectable, Logger } from '@nestjs/common';

import { parseImapMessageListFetchError } from 'src/modules/messaging/message-import-manager/drivers/imap/utils/parse-imap-message-list-fetch-error.util';

@Injectable()
export class ImapMessageListFetchErrorHandler {
  private readonly logger = new Logger(ImapMessageListFetchErrorHandler.name);

  // Logs the error, then throws it parsed into a classified exception.
  public handleError(error: Error): void {
    this.logger.error(
      `IMAP: Error fetching message list: ${JSON.stringify(error)}`,
    );

    throw parseImapMessageListFetchError(error, { cause: error });
  }
}
