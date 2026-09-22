import { type MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { assertUnreachable } from 'twenty-shared/utils';

import { CustomException } from 'src/utils/custom-exception';

// Exception thrown by the page layout module for missing records, invalid
// input, or a failed widget-duplication tab lookup.
export enum PageLayoutExceptionCode {
  PAGE_LAYOUT_NOT_FOUND = 'PAGE_LAYOUT_NOT_FOUND',
  INVALID_PAGE_LAYOUT_DATA = 'INVALID_PAGE_LAYOUT_DATA',
  TAB_NOT_FOUND_FOR_WIDGET_DUPLICATION = 'TAB_NOT_FOUND_FOR_WIDGET_DUPLICATION',
}

export enum PageLayoutExceptionMessageKey {
  PAGE_LAYOUT_NOT_FOUND = 'PAGE_LAYOUT_NOT_FOUND',
  NAME_REQUIRED = 'NAME_REQUIRED',
  TAB_NOT_FOUND_FOR_WIDGET_DUPLICATION = 'TAB_NOT_FOUND_FOR_WIDGET_DUPLICATION',
}

// Maps an exception code to the localized message shown to end users.
const getPageLayoutExceptionUserFriendlyMessage = (
  code: PageLayoutExceptionCode,
) => {
  switch (code) {
    case PageLayoutExceptionCode.PAGE_LAYOUT_NOT_FOUND:
      return msg`Page layout not found.`;
    case PageLayoutExceptionCode.INVALID_PAGE_LAYOUT_DATA:
      return msg`Invalid page layout data.`;
    case PageLayoutExceptionCode.TAB_NOT_FOUND_FOR_WIDGET_DUPLICATION:
      return msg`Tab not found for widget duplication.`;
    default:
      assertUnreachable(code);
  }
};

export class PageLayoutException extends CustomException<PageLayoutExceptionCode> {
  constructor(
    message: string,
    code: PageLayoutExceptionCode,
    { userFriendlyMessage }: { userFriendlyMessage?: MessageDescriptor } = {},
  ) {
    super(message, code, {
      userFriendlyMessage:
        userFriendlyMessage ?? getPageLayoutExceptionUserFriendlyMessage(code),
    });
  }
}

// Builds the internal (developer-facing) exception message for a given
// error key, optionally including the offending record's id.
export const generatePageLayoutExceptionMessage = (
  key: PageLayoutExceptionMessageKey,
  value?: string,
): string => {
  switch (key) {
    case PageLayoutExceptionMessageKey.PAGE_LAYOUT_NOT_FOUND:
      return `Page layout with ID "${value}" not found`;
    case PageLayoutExceptionMessageKey.NAME_REQUIRED:
      return 'Page layout name is required';
    case PageLayoutExceptionMessageKey.TAB_NOT_FOUND_FOR_WIDGET_DUPLICATION:
      return `Failed to duplicate widget: no matching tab found for original tab ID "${value}"`;
    default:
      assertUnreachable(key);
  }
};
