import { type MessageDescriptor } from '@lingui/core';

// Extracts the default (English) message text from a Lingui message descriptor, used to seed
// standard metadata labels/descriptions with plain strings
export const i18nLabel = (descriptor: MessageDescriptor): string =>
  descriptor.message ?? '';
