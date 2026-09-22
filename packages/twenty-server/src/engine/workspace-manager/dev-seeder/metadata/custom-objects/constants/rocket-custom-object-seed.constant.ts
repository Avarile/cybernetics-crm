import { type ObjectMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/object-metadata-seed.type';

// Sample custom object "Rocket", used to demo custom objects and object
// permission restrictions.
export const ROCKET_CUSTOM_OBJECT_SEED: ObjectMetadataSeed = {
  labelPlural: 'Rockets',
  labelSingular: 'Rocket',
  namePlural: 'rockets',
  nameSingular: 'rocket',
  icon: 'IconRocket',
  description: 'A rocket',
  isRemote: false,
};
