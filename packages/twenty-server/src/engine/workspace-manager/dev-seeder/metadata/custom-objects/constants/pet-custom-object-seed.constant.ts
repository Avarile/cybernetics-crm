import { type ObjectMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/object-metadata-seed.type';

// Sample custom object "Pet", used across the seed data to demo custom
// objects, custom fields, and permission restrictions.
export const PET_CUSTOM_OBJECT_SEED: ObjectMetadataSeed = {
  labelPlural: 'Pets',
  labelSingular: 'Pet',
  namePlural: 'pets',
  nameSingular: 'pet',
  icon: 'IconCat',
};
