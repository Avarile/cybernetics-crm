import { type FlatObjectPermission } from 'src/engine/metadata-modules/flat-object-permission/types/flat-object-permission.type';
import { type ObjectPermissionDTO } from 'src/engine/metadata-modules/object-permission/dtos/object-permission.dto';

// Maps a flat object permission to the GraphQL ObjectPermissionDTO shape.
export const fromFlatObjectPermissionToObjectPermissionDto = (
  flatObjectPermission: FlatObjectPermission,
): ObjectPermissionDTO => ({
  objectMetadataId: flatObjectPermission.objectMetadataId,
  canReadObjectRecords: flatObjectPermission.canReadObjectRecords,
  canUpdateObjectRecords: flatObjectPermission.canUpdateObjectRecords,
  canSoftDeleteObjectRecords: flatObjectPermission.canSoftDeleteObjectRecords,
  canDestroyObjectRecords: flatObjectPermission.canDestroyObjectRecords,
});
