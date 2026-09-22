// Input for creating a single object-level permission entry for a role.
export type CreateObjectPermissionInput = {
  roleId: string;
  objectMetadataId: string;
  canReadObjectRecords?: boolean;
  canUpdateObjectRecords?: boolean;
  canSoftDeleteObjectRecords?: boolean;
  canDestroyObjectRecords?: boolean;
  universalIdentifier?: string;
};
