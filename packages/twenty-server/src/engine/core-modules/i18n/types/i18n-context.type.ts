import { type APP_LOCALES } from 'twenty-shared/translations';
// Request-scoped locale context used to resolve translations for the current request
export type I18nContext = {
  req: {
    locale: keyof typeof APP_LOCALES;
  };
};
