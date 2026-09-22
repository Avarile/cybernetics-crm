import { v4 } from 'uuid';

import { type FlatApplication } from 'src/engine/core-modules/application/types/flat-application.type';
import { type AllFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/all-flat-entity-maps.type';
import { resolveEntityRelationUniversalIdentifiers } from 'src/engine/metadata-modules/flat-entity/utils/resolve-entity-relation-universal-identifiers.util';
import { type FieldPermissionInput } from 'src/engine/metadata-modules/object-permission/dtos/upsert-field-permissions.input';
import { type UniversalFlatFieldPermission } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/types/universal-flat-field-permission.type';

// Builds a new universal flat field permission from a create-field-permission input,
// generating fresh ids and resolving role/object metadata/field metadata references
// to universal identifiers.
export const fromCreateFieldPermissionInputToUniversalFlatFieldPermission = ({
  fieldPermissionInput,
  roleId,
  flatApplication,
  flatRoleMaps,
  flatObjectMetadataMaps,
  flatFieldMetadataMaps,
}: {
  fieldPermissionInput: FieldPermissionInput;
  roleId: string;
  flatApplication: FlatApplication;
} & Pick<
  AllFlatEntityMaps,
  'flatRoleMaps' | 'flatObjectMetadataMaps' | 'flatFieldMetadataMaps'
>): UniversalFlatFieldPermission & { id: string } => {
  const now = new Date().toISOString();

  const {
    roleUniversalIdentifier,
    objectMetadataUniversalIdentifier,
    fieldMetadataUniversalIdentifier,
  } = resolveEntityRelationUniversalIdentifiers({
    metadataName: 'fieldPermission',
    foreignKeyValues: {
      roleId,
      objectMetadataId: fieldPermissionInput.objectMetadataId,
      fieldMetadataId: fieldPermissionInput.fieldMetadataId,
    },
    flatEntityMaps: {
      flatRoleMaps,
      flatObjectMetadataMaps,
      flatFieldMetadataMaps,
    },
  });

  return {
    id: v4(),
    universalIdentifier: v4(),
    applicationUniversalIdentifier: flatApplication.universalIdentifier,
    roleUniversalIdentifier,
    objectMetadataUniversalIdentifier,
    fieldMetadataUniversalIdentifier,
    canReadFieldValue: fieldPermissionInput.canReadFieldValue ?? undefined,
    canUpdateFieldValue: fieldPermissionInput.canUpdateFieldValue ?? undefined,
    createdAt: now,
    updatedAt: now,
  };
};
