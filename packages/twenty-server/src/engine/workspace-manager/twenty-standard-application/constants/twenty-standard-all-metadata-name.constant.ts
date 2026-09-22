import { type AllMetadataName } from 'twenty-shared/metadata';

// Ordered list of all metadata entity kinds that make up the standard application, used to drive
// generic build/diff logic across each metadata type
export const TWENTY_STANDARD_ALL_METADATA_NAME = [
  'index',
  'searchFieldMetadata',
  'objectMetadata',
  'fieldMetadata',
  'viewField',
  'viewFieldGroup',
  'viewFilter',
  'viewGroup',
  'view',
  'navigationMenuItem',
  'permissionFlag',
  'role',
  'agent',
  'skill',
  'pageLayout',
  'pageLayoutTab',
  'pageLayoutWidget',
  'commandMenuItem',
] as const satisfies AllMetadataName[];
