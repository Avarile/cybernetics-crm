import { type RoleTargetForeignKeyProperties } from 'src/engine/metadata-modules/flat-role-target/types/role-target-foreign-key-properties.type';

// Input for assigning a role to a target entity (user workspace, agent, or API key),
// identified generically via its foreign key property name and id.
export type CreateRoleTargetInput = {
  roleId: string;
  applicationId?: string;
  universalIdentifier?: string;
  targetId: string;
  targetMetadataForeignKey: RoleTargetForeignKeyProperties;
};
