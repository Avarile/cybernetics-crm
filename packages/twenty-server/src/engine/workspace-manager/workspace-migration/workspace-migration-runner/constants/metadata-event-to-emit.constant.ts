import { type AllMetadataName } from 'twenty-shared/metadata';

// webhook and applicationVariable are the two metadata types with an always-encrypted
// secret-bearing field (webhook's signing secret, applicationVariable's `value`) — kept
// false so their create/update/delete never gets broadcast via the metadata event
// stream, which subscribers can observe.
export const METADATA_EVENTS_TO_EMIT = {
  frontComponent: true,
  objectMetadata: true,
  fieldMetadata: true,
  view: true,
  viewField: true,
  viewFieldGroup: true,
  viewGroup: true,
  viewFilter: true,
  viewFilterGroup: true,
  role: true,
  roleTarget: true,
  agent: true,
  skill: true,
  pageLayout: true,
  pageLayoutWidget: true,
  pageLayoutTab: true,
  commandMenuItem: true,
  navigationMenuItem: true,
  rolePermissionFlag: true,
  permissionFlag: true,
  objectPermission: true,
  fieldPermission: true,
  rowLevelPermissionPredicate: true,
  rowLevelPermissionPredicateGroup: true,
  index: true,
  logicFunction: true,
  viewSort: true,
  webhook: false,
  applicationVariable: false,
  connectionProvider: true,
  searchFieldMetadata: true,
} as const satisfies { [P in AllMetadataName]: boolean };
