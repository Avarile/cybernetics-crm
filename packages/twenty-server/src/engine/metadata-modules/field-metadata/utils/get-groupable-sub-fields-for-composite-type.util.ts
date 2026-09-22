import {
  compositeTypeDefinitions,
  FieldMetadataType,
} from 'twenty-shared/types';

import { isCompositePropertySupportedInGroupBy } from 'src/engine/metadata-modules/field-metadata/utils/is-composite-property-supported-in-group-by.util';

// Returns the sub-property names of a composite type that can be used for
// group-by, or null if the type isn't composite.
export const getGroupableSubFieldsForCompositeType = (
  type: FieldMetadataType,
): string[] | null => {
  const compositeTypeDefinition = compositeTypeDefinitions.get(type);

  if (!compositeTypeDefinition) {
    return null;
  }

  return compositeTypeDefinition.properties
    .filter(isCompositePropertySupportedInGroupBy)
    .map((property) => property.name);
};
