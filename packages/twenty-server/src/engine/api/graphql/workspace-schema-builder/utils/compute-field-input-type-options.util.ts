import { FieldMetadataType } from 'twenty-shared/types';

import { GqlInputTypeDefinitionKind } from 'src/engine/api/graphql/workspace-schema-builder/enums/gql-input-type-definition-kind.enum';
import { type TypeOptions } from 'src/engine/api/graphql/workspace-schema-builder/services/type-mapper.service';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';

export const computeFieldInputTypeOptions = (
  fieldMetadata: FlatFieldMetadata,
  kind: GqlInputTypeDefinitionKind,
): TypeOptions => {
  return {
    nullable: fieldMetadata.isNullable ?? undefined,
    defaultValue: fieldMetadata.defaultValue ?? undefined,
    // Filter inputs for MULTI_SELECT use MultiSelectFilterType's own
    // `containsAny: [String]` field instead of wrapping the whole input in a
    // list, so isArray is skipped specifically for the Filter kind.
    isArray:
      kind !== GqlInputTypeDefinitionKind.Filter &&
      fieldMetadata.type === FieldMetadataType.MULTI_SELECT,
    settings: fieldMetadata.settings,
    isIdField: fieldMetadata.name === 'id',
  };
};
