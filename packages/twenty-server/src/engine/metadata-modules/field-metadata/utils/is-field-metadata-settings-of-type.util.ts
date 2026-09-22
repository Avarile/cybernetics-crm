import {
  type AllFieldMetadataSettings,
  type FieldMetadataSettingsMapping,
  FieldMetadataType,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { type UniversalFlatFieldMetadata } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/types/universal-flat-field-metadata.type';

// Type guard narrowing a flat field's settings to the given field type's
// settings shape; settings have no discriminator, so this just enforces
// presence for the field types that require settings.
export const isFieldMetadataSettingsOfType = <
  T extends keyof FieldMetadataSettingsMapping,
>(
  settings: AllFieldMetadataSettings | null,
  fieldMetadataType: T,
): settings is FieldMetadataSettingsMapping[T] => {
  // Settings don't have a discriminator - the type is determined by fieldMetadataType
  // For required settings types (RELATION, MORPH_RELATION, FILES), ensure settings is defined
  if (
    fieldMetadataType === FieldMetadataType.RELATION ||
    fieldMetadataType === FieldMetadataType.MORPH_RELATION ||
    fieldMetadataType === FieldMetadataType.FILES
  ) {
    return isDefined(settings);
  }

  return true;
};

// Same check as isFieldMetadataSettingsOfType, for a universal flat field's settings shape.
export const isUniversalFieldMetadataSettingsOftype = <
  T extends keyof FieldMetadataSettingsMapping,
>(
  settings: UniversalFlatFieldMetadata['universalSettings'],
  fieldMetadataType: T,
): settings is UniversalFlatFieldMetadata<T>['universalSettings'] => {
  // Settings don't have a discriminator - the type is determined by fieldMetadataType
  // For required settings types (RELATION, MORPH_RELATION, FILES), ensure settings is defined
  if (
    fieldMetadataType === FieldMetadataType.RELATION ||
    fieldMetadataType === FieldMetadataType.MORPH_RELATION ||
    fieldMetadataType === FieldMetadataType.FILES
  ) {
    return isDefined(settings);
  }

  return true;
};
