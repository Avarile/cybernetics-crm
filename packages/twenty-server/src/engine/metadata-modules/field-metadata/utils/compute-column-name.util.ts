import {
  type FieldMetadataType,
  type CompositeProperty,
} from 'twenty-shared/types';
import { pascalCase } from 'twenty-shared/utils';

import {
  FieldMetadataException,
  FieldMetadataExceptionCode,
} from 'src/engine/metadata-modules/field-metadata/field-metadata.exception';
import { isCompositeFieldMetadataType } from 'src/engine/metadata-modules/field-metadata/utils/is-composite-field-metadata-type.util';

type ComputeColumnNameOptions = { isForeignKey?: boolean };

export type FieldTypeAndNameMetadata = {
  name: string;
  type: FieldMetadataType;
};

// Computes the DB column name for a plain (non-composite) field, appending
// "Id" for foreign keys; throws if given a composite field type.
// TODO: If we need to implement custom name logic for columns, we can do it here
export function computeColumnName(
  fieldMetadataOrFieldName: FieldTypeAndNameMetadata | string,
  options?: ComputeColumnNameOptions,
): string {
  const generateName = (name: string) => {
    return options?.isForeignKey ? `${name}Id` : name;
  };

  if (typeof fieldMetadataOrFieldName === 'string') {
    return generateName(fieldMetadataOrFieldName);
  }

  if (isCompositeFieldMetadataType(fieldMetadataOrFieldName.type)) {
    throw new FieldMetadataException(
      `Cannot compute composite column name for field: ${fieldMetadataOrFieldName.type}`,
      FieldMetadataExceptionCode.INVALID_FIELD_INPUT,
    );
  }

  return generateName(fieldMetadataOrFieldName.name);
}

// Computes the DB column name for one sub-property of a composite field
// (e.g. addressCity); throws if given a non-composite field type.
export function computeCompositeColumnName(
  fieldMetadataOrFieldName: FieldTypeAndNameMetadata | string,
  compositeProperty: CompositeProperty,
): string {
  const generateName = (name: string) => {
    return `${name}${pascalCase(compositeProperty.name)}`;
  };

  if (typeof fieldMetadataOrFieldName === 'string') {
    return generateName(fieldMetadataOrFieldName);
  }

  if (!isCompositeFieldMetadataType(fieldMetadataOrFieldName.type)) {
    throw new FieldMetadataException(
      `Cannot compute composite column name for non-composite field metadata type: ${fieldMetadataOrFieldName.type}`,
      FieldMetadataExceptionCode.INVALID_FIELD_INPUT,
    );
  }

  return generateName(fieldMetadataOrFieldName.name);
}
