import { type MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { assertUnreachable } from 'twenty-shared/utils';

import { CustomException } from 'src/utils/custom-exception';

export enum DatabaseCentreExceptionCode {
  CONNECTION_NOT_CONFIGURED = 'CONNECTION_NOT_CONFIGURED',
  CONNECTION_DISABLED = 'CONNECTION_DISABLED',
  INVALID_BASE_URL = 'INVALID_BASE_URL',
  TOKEN_DECRYPTION_FAILED = 'TOKEN_DECRYPTION_FAILED',
  UPSTREAM_UNAUTHORIZED = 'UPSTREAM_UNAUTHORIZED',
  UPSTREAM_FORBIDDEN = 'UPSTREAM_FORBIDDEN',
  UPSTREAM_NOT_FOUND = 'UPSTREAM_NOT_FOUND',
  UPSTREAM_BAD_REQUEST = 'UPSTREAM_BAD_REQUEST',
  UPSTREAM_RATE_LIMITED = 'UPSTREAM_RATE_LIMITED',
  UPSTREAM_UNREACHABLE = 'UPSTREAM_UNREACHABLE',
  TARGET_OBJECT_NOT_SUPPORTED = 'TARGET_OBJECT_NOT_SUPPORTED',
  TARGET_RECORD_NOT_FOUND = 'TARGET_RECORD_NOT_FOUND',
  ATTACHMENT_LIMIT_REACHED = 'ATTACHMENT_LIMIT_REACHED',
  ALREADY_ATTACHED = 'ALREADY_ATTACHED',
  DATABASE_RECORD_TARGET_NOT_FOUND = 'DATABASE_RECORD_TARGET_NOT_FOUND',
}

const getDatabaseCentreExceptionUserFriendlyMessage = (
  code: DatabaseCentreExceptionCode,
) => {
  switch (code) {
    case DatabaseCentreExceptionCode.CONNECTION_NOT_CONFIGURED:
      return msg`The data centre connection is not configured for this workspace.`;
    case DatabaseCentreExceptionCode.CONNECTION_DISABLED:
      return msg`The data centre connection is disabled.`;
    case DatabaseCentreExceptionCode.INVALID_BASE_URL:
      return msg`The data centre URL is invalid, not allowed, or could not be resolved.`;
    case DatabaseCentreExceptionCode.TOKEN_DECRYPTION_FAILED:
      return msg`The stored data centre token can't be read. Please enter it again.`;
    case DatabaseCentreExceptionCode.UPSTREAM_UNAUTHORIZED:
      return msg`The data centre rejected the API token.`;
    case DatabaseCentreExceptionCode.UPSTREAM_FORBIDDEN:
      return msg`The API token does not have access to this data centre resource.`;
    case DatabaseCentreExceptionCode.UPSTREAM_NOT_FOUND:
      return msg`The data centre resource was not found.`;
    case DatabaseCentreExceptionCode.UPSTREAM_BAD_REQUEST:
      return msg`The data centre rejected the request.`;
    case DatabaseCentreExceptionCode.UPSTREAM_RATE_LIMITED:
      return msg`The data centre is rate limiting requests. Please try again shortly.`;
    case DatabaseCentreExceptionCode.UPSTREAM_UNREACHABLE:
      return msg`The data centre could not be reached.`;
    case DatabaseCentreExceptionCode.TARGET_OBJECT_NOT_SUPPORTED:
      return msg`Data centre records can't be attached to this object.`;
    case DatabaseCentreExceptionCode.TARGET_RECORD_NOT_FOUND:
      return msg`Record not found.`;
    case DatabaseCentreExceptionCode.ATTACHMENT_LIMIT_REACHED:
      return msg`This record already has the maximum number of attached data centre records.`;
    case DatabaseCentreExceptionCode.ALREADY_ATTACHED:
      return msg`This data centre record is already attached.`;
    case DatabaseCentreExceptionCode.DATABASE_RECORD_TARGET_NOT_FOUND:
      return msg`Attached data centre record not found.`;
    default:
      assertUnreachable(code);
  }
};

// Thrown for data-centre integration failures: missing/invalid connection,
// upstream API errors, and attach constraint violations.
export class DatabaseCentreException extends CustomException<DatabaseCentreExceptionCode> {
  constructor(
    message: string,
    code: DatabaseCentreExceptionCode,
    { userFriendlyMessage }: { userFriendlyMessage?: MessageDescriptor } = {},
  ) {
    super(message, code, {
      userFriendlyMessage:
        userFriendlyMessage ??
        getDatabaseCentreExceptionUserFriendlyMessage(code),
    });
  }
}
