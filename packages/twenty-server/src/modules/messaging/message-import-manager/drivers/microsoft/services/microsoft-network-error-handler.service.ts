// Detects whether a Microsoft Graph error's body indicates a known
// temporary/transient failure and, if so, wraps it as a retryable
// exception; returns null for anything else.
import { Injectable, Logger } from '@nestjs/common';

import {
  MessageImportDriverException,
  MessageImportDriverExceptionCode,
} from 'src/modules/messaging/message-import-manager/drivers/exceptions/message-import-driver.exception';
import { isMicrosoftClientTemporaryError } from 'src/modules/messaging/message-import-manager/drivers/microsoft/utils/is-temporary-error.utils';

@Injectable()
export class MicrosoftNetworkErrorHandler {
  private readonly logger = new Logger(MicrosoftNetworkErrorHandler.name);

  // oxlint-disable-next-line typescript/no-explicit-any
  // Returns a TEMPORARY_ERROR exception when the error body matches a
  // known transient Microsoft error pattern, null otherwise.
  public handleError(error: any): MessageImportDriverException | null {
    const isBodyString = error.body && typeof error.body === 'string';
    const isTemporaryError =
      isBodyString && isMicrosoftClientTemporaryError(error.body);

    if (isTemporaryError) {
      return new MessageImportDriverException(
        `code: ${error.code} - body: ${error.body}`,
        MessageImportDriverExceptionCode.TEMPORARY_ERROR,
        { cause: error },
      );
    }

    return null;
  }
}
