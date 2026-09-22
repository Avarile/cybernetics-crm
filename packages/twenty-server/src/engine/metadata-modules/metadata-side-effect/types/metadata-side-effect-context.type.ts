// Context passed to every side effect handler, carrying the current
// workspace migration build options.

import { type WorkspaceMigrationBuilderOptions } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/types/workspace-migration-builder-options.type';

export type MetadataSideEffectContext = {
  buildOptions: WorkspaceMigrationBuilderOptions;
};
