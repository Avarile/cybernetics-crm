import { type ObjectMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/object-metadata-seed.type';

// Junction custom object linking a Pet to its caretaker (Person or Company)
// via a morph relation.
export const PET_CARE_AGREEMENT_CUSTOM_OBJECT_SEED: ObjectMetadataSeed = {
  labelPlural: 'Pet Care Agreements',
  labelSingular: 'Pet Care Agreement',
  namePlural: 'petCareAgreements',
  nameSingular: 'petCareAgreement',
  icon: 'IconPaw',
  skipNameField: true,
};
