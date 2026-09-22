// Shape of a single page layout widget validation error, pairing an
// exception code with a developer message and optional user-facing message.

import { type MessageDescriptor } from '@lingui/core';

import { type PageLayoutWidgetExceptionCode } from 'src/engine/metadata-modules/page-layout-widget/exceptions/page-layout-widget.exception';

export type FlatPageLayoutWidgetValidationError = {
  code: PageLayoutWidgetExceptionCode;
  message: string;
  userFriendlyMessage?: MessageDescriptor;
  value?: unknown;
};
