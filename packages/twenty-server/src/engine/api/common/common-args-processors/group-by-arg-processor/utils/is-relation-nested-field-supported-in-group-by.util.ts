import { isFieldMetadataSupportedInGroupBy } from 'twenty-shared/utils';

import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { isMorphOrRelationFlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/utils/is-morph-or-relation-flat-field-metadata.util';

// True when a field reached through a one-hop relation groupBy (e.g.
// company.name) can itself be grouped by; the relation's own "id" is
// always allowed.
export const isRelationNestedFieldSupportedInGroupBy = ({
  nestedFieldName,
  nestedFieldMetadata,
}: {
  nestedFieldName: string;
  nestedFieldMetadata: FlatFieldMetadata;
}): boolean => {
  if (nestedFieldName === 'id') {
    return true;
  }

  const relationType = isMorphOrRelationFlatFieldMetadata(nestedFieldMetadata)
    ? nestedFieldMetadata.settings.relationType
    : null;

  return isFieldMetadataSupportedInGroupBy({
    type: nestedFieldMetadata.type,
    name: nestedFieldMetadata.name,
    isSystem: nestedFieldMetadata.isSystem,
    relationType,
  });
};
