import { type I18n } from '@lingui/core';
import { type APP_LOCALES } from 'twenty-shared/translations';

// Context needed to resolve a metadata entity's effective (translated,
// override-aware) display value: locale, i18n instance, whether the
// entity belongs to the standard app, and the application's translation
// catalog for custom apps.
export type EffectiveEntityI18nContext = {
  locale: keyof typeof APP_LOCALES | undefined;
  i18nInstance: I18n;
  isStandardApp: boolean;
  applicationCatalog?: Record<string, string>;
};
