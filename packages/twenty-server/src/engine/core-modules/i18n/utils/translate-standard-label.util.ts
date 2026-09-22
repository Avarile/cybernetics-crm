import { type I18n } from '@lingui/core';
import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

import { generateMessageId } from 'src/engine/core-modules/i18n/utils/generateMessageId';

// Translates a standard-object label: custom apps look up the translation in their
// own catalog, standard apps fall back to the shared i18n instance, source text
// otherwise
export const translateStandardLabel = ({
  sourceValue,
  isStandardApp,
  applicationCatalog,
  i18nInstance,
}: {
  sourceValue: string;
  isStandardApp: boolean;
  applicationCatalog: Record<string, string> | undefined;
  i18nInstance: I18n;
}): string => {
  if (!isNonEmptyString(sourceValue)) {
    return sourceValue ?? '';
  }

  if (!isDefined(applicationCatalog) && !isStandardApp) {
    return sourceValue;
  }

  const messageId = generateMessageId(sourceValue);

  if (isDefined(applicationCatalog)) {
    return applicationCatalog[messageId] ?? sourceValue;
  }

  if (isStandardApp) {
    const translatedMessage = i18nInstance._(messageId);

    return translatedMessage === messageId ? sourceValue : translatedMessage;
  }

  return sourceValue;
};
