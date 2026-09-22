// Adapts computeUniqueFieldMetadataIdsFromIndexes to work off TypeORM
// IndexMetadataEntity instances instead of flat entities.

import { type IndexMetadataEntity } from 'src/engine/metadata-modules/index-metadata/index-metadata.entity';
import { computeUniqueFieldMetadataIdsFromIndexes } from 'src/engine/metadata-modules/index-metadata/utils/compute-unique-field-metadata-ids-from-indexes.util';

// Delegates directly to computeUniqueFieldMetadataIdsFromIndexes.
export const computeUniqueFieldMetadataIdsFromIndexEntities = (
  indexEntities: ReadonlyArray<IndexMetadataEntity>,
): Set<string> => computeUniqueFieldMetadataIdsFromIndexes(indexEntities);
