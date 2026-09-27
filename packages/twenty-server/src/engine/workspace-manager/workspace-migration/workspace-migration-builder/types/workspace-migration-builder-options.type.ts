import { type InferDeletionFromMissingEntities } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/types/infer-deletion-from-missing-entities.type';

export type WorkspaceMigrationBuilderOptions = {
  inferDeletionFromMissingEntities?: InferDeletionFromMissingEntities;
  // Bypasses several "this is system-managed, don't touch it" validator checks (e.g.
  // isSystem objects, non-editable roles) — set true only when building/updating
  // Twenty's own standard application, never for a regular user-triggered migration.
  isSystemBuild: boolean;
  applicationUniversalIdentifier: string;
};
