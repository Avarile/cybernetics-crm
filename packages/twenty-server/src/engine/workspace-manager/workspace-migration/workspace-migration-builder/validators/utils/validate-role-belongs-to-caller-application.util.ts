import { msg, t } from '@lingui/core/macro';

import { PermissionsExceptionCode } from 'src/engine/metadata-modules/permissions/permissions.exception';
import { type UniversalFlatRole } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/types/universal-flat-role.type';
import { type FlatEntityValidationError } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/builders/types/failed-flat-entity-validation.type';
import { type WorkspaceMigrationBuilderOptions } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/types/workspace-migration-builder-options.type';

// Prevents one application's migration from creating/updating a permission-related entity
// that targets a role owned by a *different* application — without this, an application
// could grant or revoke access on another application's role.
export const validateRoleBelongsToCallerApplication = ({
  referencedRole,
  buildOptions,
}: {
  referencedRole: UniversalFlatRole;
  buildOptions: WorkspaceMigrationBuilderOptions;
}): FlatEntityValidationError[] => {
  if (
    referencedRole.applicationUniversalIdentifier !==
    buildOptions.applicationUniversalIdentifier
  ) {
    return [
      {
        code: PermissionsExceptionCode.ROLE_BELONGS_TO_ANOTHER_APPLICATION,
        message: t`Cannot target a role owned by another application`,
        userFriendlyMessage: msg`Cannot target a role owned by another application.`,
      },
    ];
  }

  return [];
};
