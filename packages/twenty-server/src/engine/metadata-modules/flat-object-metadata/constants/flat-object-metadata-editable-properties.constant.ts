// Lists the flat object metadata properties end users are allowed to edit,
// split by standard vs custom objects since standard objects expose fewer fields.
import { type MetadataEntityPropertyName } from 'src/engine/metadata-modules/flat-entity/constant/all-entity-properties-configuration-by-metadata-name.constant';

export const FLAT_OBJECT_METADATA_EDITABLE_PROPERTIES = {
  custom: [
    'color',
    'description',
    'icon',
    'isActive',
    'isLabelSyncedWithName',
    'isSearchable',
    'labelPlural',
    'labelSingular',
    'namePlural',
    'nameSingular',
    'labelIdentifierFieldMetadataId',
    'imageIdentifierFieldMetadataId',
  ],
  standard: [
    'color',
    'description',
    'icon',
    'isActive',
    'isSearchable',
    'labelPlural',
    'labelSingular',
    'imageIdentifierFieldMetadataId',
  ],
} as const satisfies Record<
  'standard' | 'custom',
  MetadataEntityPropertyName<'objectMetadata'>[]
>;
