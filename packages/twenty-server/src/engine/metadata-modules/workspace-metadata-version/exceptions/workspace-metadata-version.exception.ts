import { type MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { assertUnreachable } from 'twenty-shared/utils';

import { CustomException } from 'src/utils/custom-exception';

// Error codes for workspace-metadata-version failures.
export enum WorkspaceMetadataVersionExceptionCode {
  METADATA_VERSION_NOT_FOUND = 'METADATA_VERSION_NOT_FOUND',
}

// Maps an exception code to the message shown to the end user.
const getWorkspaceMetadataVersionExceptionUserFriendlyMessage = (
  code: WorkspaceMetadataVersionExceptionCode,
) => {
  switch (code) {
    case WorkspaceMetadataVersionExceptionCode.METADATA_VERSION_NOT_FOUND:
      return msg`Metadata version not found.`;
    default:
      assertUnreachable(code);
  }
};

// Domain exception for workspace-metadata-version failures, carrying a user-friendly message by default.
export class WorkspaceMetadataVersionException extends CustomException<WorkspaceMetadataVersionExceptionCode> {
  constructor(
    message: string,
    code: WorkspaceMetadataVersionExceptionCode,
    { userFriendlyMessage }: { userFriendlyMessage?: MessageDescriptor } = {},
  ) {
    super(message, code, {
      userFriendlyMessage:
        userFriendlyMessage ??
        getWorkspaceMetadataVersionExceptionUserFriendlyMessage(code),
    });
  }
}
