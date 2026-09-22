import { type AllMetadataName } from 'twenty-shared/metadata';
import { type APP_LOCALES } from 'twenty-shared/translations';

import {
  type MetadataEntityOverridablePropertyName,
  type MetadataEntityTranslatablePropertyName,
} from 'src/engine/metadata-modules/flat-entity/constant/all-entity-properties-configuration-by-metadata-name.constant';

// Per-locale override values for a metadata entity's translatable
// properties (e.g. label overrides for a specific language).
type OverridesTranslationEntry<T extends AllMetadataName> = {
  [P in MetadataEntityTranslatablePropertyName<T>]?: string | null;
};

// Shape of the workspace-level overrides stored for a metadata entity:
// direct property overrides plus optional per-locale translation overrides.
export type MetadataPresentationOverrides<T extends AllMetadataName> = {
  [P in MetadataEntityOverridablePropertyName<T>]?: string | null;
} & {
  translations?: Partial<
    Record<keyof typeof APP_LOCALES, OverridesTranslationEntry<T>>
  > | null;
};
