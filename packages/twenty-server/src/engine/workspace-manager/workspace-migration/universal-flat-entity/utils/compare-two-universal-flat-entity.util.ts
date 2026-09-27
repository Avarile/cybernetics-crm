import diff from 'microdiff';
import { type AllMetadataName } from 'twenty-shared/metadata';
import { type FromTo } from 'twenty-shared/types';
import { parseJson } from 'twenty-shared/utils';

import { ALL_UNIVERSAL_FLAT_ENTITY_PROPERTIES_TO_COMPARE_AND_STRINGIFY } from 'src/engine/metadata-modules/flat-entity/constant/all-universal-flat-entity-properties-to-compare-and-stringify.constant';
import { type MetadataUniversalFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/metadata-universal-flat-entity.type';
import { type MetadataUniversalFlatEntityPropertiesToStringify } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/types/metadata-universal-flat-entity-properties-to-stringify.type';
import { type UniversalFlatEntityUpdate } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/types/universal-flat-entity-update.type';
import { transformUniversalFlatEntityForComparison } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/utils/transform-universal-flat-entity-for-comparison.util';

type CompareTwoUniversalFlatEntityArgs<T extends AllMetadataName> = FromTo<
  MetadataUniversalFlatEntity<T>,
  'universalFlatEntity'
> & { metadataName: T };

// Properties marked toStringify in ALL_ENTITY_PROPERTIES_CONFIGURATION_BY_METADATA_NAME
// are JSON.stringified (with keys ordered for stability) before diffing, so any change
// anywhere inside them collapses to one top-level CHANGE carrying the whole new value —
// simpler for handlers to apply than a deep partial patch. Every compared property is
// always present (possibly undefined) on both sides (see
// transformUniversalFlatEntityForComparison), so a top-level CREATE/REMOVE is not
// expected; that assumption only holds for non-stringified properties if they're plain
// scalars, since a nested addition/removal inside an un-stringified object or array
// would still surface as a CREATE/REMOVE and be silently dropped below.
export const compareTwoFlatEntity = <T extends AllMetadataName>({
  fromUniversalFlatEntity,
  toUniversalFlatEntity,
  metadataName,
}: CompareTwoUniversalFlatEntityArgs<T>):
  | UniversalFlatEntityUpdate<T>
  | undefined => {
  const { propertiesToStringify, propertiesToCompare } =
    ALL_UNIVERSAL_FLAT_ENTITY_PROPERTIES_TO_COMPARE_AND_STRINGIFY[metadataName];

  const [transformedFromUniversalFlatEntity, transformedToUniversalFlatEntity] =
    [fromUniversalFlatEntity, toUniversalFlatEntity].map(
      (universalFlatEntity) =>
        transformUniversalFlatEntityForComparison({
          metadataName,
          universalFlatEntity,
          propertiesToCompare,
          propertiesToStringify,
        }),
    );

  const flatEntityDifferences = diff(
    transformedFromUniversalFlatEntity,
    transformedToUniversalFlatEntity,
  );

  if (flatEntityDifferences.length === 0) {
    return undefined;
  }

  const initialAccumulator: UniversalFlatEntityUpdate<T> = {};

  return flatEntityDifferences.reduce((accumulator, difference) => {
    switch (difference.type) {
      case 'CHANGE': {
        const { path, value } = difference;
        const property = path[0];
        const isJsonb = propertiesToStringify.includes(
          property as MetadataUniversalFlatEntityPropertiesToStringify<T>,
        );

        if (isJsonb) {
          return {
            ...accumulator,
            [property]: parseJson(value),
          };
        }

        return {
          ...accumulator,
          [property]: value,
        };
      }
      case 'CREATE':
      case 'REMOVE':
      default: {
        // Should never occur, we should only provide null never undefined and so on
        return accumulator;
      }
    }
  }, initialAccumulator);
};
