import { type I18n, type MessageDescriptor } from '@lingui/core';
import { isArray, isObject, isString } from '@sniptt/guards';

const USER_FRIENDLY_MESSAGE_KEY = 'userFriendlyMessage';

// A MessageDescriptor is any object carrying a string `id` field
const isMessageDescriptor = (value: unknown): value is MessageDescriptor =>
  isObject(value) && 'id' in value && isString(value.id);

// Walks an arbitrary payload, translating any MessageDescriptor found under a
// `userFriendlyMessage` key while leaving everything else untouched
const translateValueRecursively = (
  value: unknown,
  i18n: I18n,
  parentKey?: string,
): unknown => {
  if (parentKey === USER_FRIENDLY_MESSAGE_KEY && isMessageDescriptor(value)) {
    return i18n._(value);
  }

  if (isArray(value)) {
    return value.map((item) =>
      translateValueRecursively(item, i18n, parentKey),
    );
  }

  if (isObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        translateValueRecursively(nestedValue, i18n, key),
      ]),
    );
  }

  return value;
};

// Recursively resolves every userFriendlyMessage MessageDescriptor in a payload
// (e.g. an error response) to translated text for the given i18n instance
export const translateUserFriendlyMessageDescriptors = (
  payload: object,
  i18n: I18n,
): Record<string, unknown> =>
  translateValueRecursively(payload, i18n) as Record<string, unknown>;
