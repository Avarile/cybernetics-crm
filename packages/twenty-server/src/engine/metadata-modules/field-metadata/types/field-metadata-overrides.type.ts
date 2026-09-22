// Application-specific overrides (label/description/icon, per-locale) layered
// on top of a standard field's base metadata.
import { type APP_LOCALES } from 'twenty-shared/translations';

export type FieldMetadataOverrides = {
  label?: string | null;
  description?: string | null;
  icon?: string | null;
  translations?: Partial<
    Record<
      keyof typeof APP_LOCALES,
      {
        label?: string | null;
        description?: string | null;
      }
    >
  > | null;
};
