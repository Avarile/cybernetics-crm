import { type ObjectMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/object-metadata-seed.type';

// Junction custom object linking Person and Company for the sample
// "previous employment" relation.
export const EMPLOYMENT_HISTORY_CUSTOM_OBJECT_SEED: ObjectMetadataSeed = {
  labelPlural: 'Employment Histories',
  labelSingular: 'Employment History',
  namePlural: 'employmentHistories',
  nameSingular: 'employmentHistory',
  icon: 'IconBriefcase',
  skipNameField: true,
};
