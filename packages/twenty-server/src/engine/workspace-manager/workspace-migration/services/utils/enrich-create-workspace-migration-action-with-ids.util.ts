import { type AllMetadataName } from 'twenty-shared/metadata';
import { assertUnreachable, isDefined } from 'twenty-shared/utils';
import { v4 } from 'uuid';

import { type UniversalCreateFieldAction } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/builders/field/types/workspace-migration-field-action';
import { type UniversalCreateObjectAction } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/builders/object/types/workspace-migration-object-action';
import { type UniversalCreatePageLayoutAction } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/builders/page-layout/types/workspace-migration-page-layout-action.type';
import { type WorkspaceMigration } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/types/workspace-migration.type';

// Pre-resolved ids to use for entities being created, keyed by metadata kind then universal
// identifier — lets a "create" action reuse an already-known id instead of generating a fresh one
export type IdByUniversalIdentifierByMetadataName = {
  [P in AllMetadataName]?: Record<string, string>;
};

// Builds the field-id-by-universal-identifier map for a "create object" action: reuses any provided
// field ids (from a prior build pass) and generates fresh ids for the rest, so the object's fields can
// be created with stable, pre-known ids
const buildFieldIdByUniversalIdentifierForObjectAction = ({
  action,
  fieldMetadataIdByUniversalIdentifier,
}: {
  action: UniversalCreateObjectAction;
  fieldMetadataIdByUniversalIdentifier: Record<string, string>;
}): Record<string, string> | undefined => {
  const fieldIdByUniversalIdentifier = {
    ...action.fieldIdByUniversalIdentifier,
  };

  for (const universalFlatFieldMetadata of action.universalFlatFieldMetadatas) {
    const { universalIdentifier } = universalFlatFieldMetadata;
    const providedFieldId =
      fieldMetadataIdByUniversalIdentifier[universalIdentifier];

    if (isDefined(providedFieldId)) {
      fieldIdByUniversalIdentifier[universalIdentifier] = providedFieldId;
    } else if (!isDefined(fieldIdByUniversalIdentifier[universalIdentifier])) {
      fieldIdByUniversalIdentifier[universalIdentifier] = v4();
    }
  }

  if (Object.keys(fieldIdByUniversalIdentifier).length === 0) {
    return undefined;
  }

  return fieldIdByUniversalIdentifier;
};

// Merges a "create page layout" action's own tab id map with any externally provided page layout tab
// ids, so its tabs can be created with stable, pre-known ids
const buildTabIdByUniversalIdentifier = ({
  action,
  pageLayoutTabIdByUniversalIdentifier,
}: {
  action: UniversalCreatePageLayoutAction;
  pageLayoutTabIdByUniversalIdentifier: Record<string, string>;
}): Record<string, string> | undefined => {
  const tabIdByUniversalIdentifier = {
    ...action.tabIdByUniversalIdentifier,
    ...pageLayoutTabIdByUniversalIdentifier,
  };

  if (Object.keys(tabIdByUniversalIdentifier).length === 0) {
    return undefined;
  }

  return tabIdByUniversalIdentifier;
};

// Builds a universal-identifier-to-id map covering every field created across all "create fieldMetadata"
// actions (including their related field, for relation pairs), reusing each action's own generated id
// as the fallback so later lookups (e.g. resolving relation targets) stay consistent
const buildFieldIdByUniversalIdentifierForFieldActions = ({
  actions,
  providedFieldIdByUniversalIdentifier,
}: {
  actions: WorkspaceMigration['actions'];
  providedFieldIdByUniversalIdentifier?: Record<string, string>;
}): Record<string, string> | undefined => {
  const fieldIdByUniversalIdentifier = {
    ...providedFieldIdByUniversalIdentifier,
  };

  const setFieldIdIfMissing = ({
    universalIdentifier,
    fallbackId,
  }: {
    universalIdentifier: string;
    fallbackId?: string;
  }) => {
    if (isDefined(fieldIdByUniversalIdentifier[universalIdentifier])) {
      return;
    }

    fieldIdByUniversalIdentifier[universalIdentifier] = fallbackId ?? v4();
  };

  for (const action of actions) {
    if (action.type !== 'create' || action.metadataName !== 'fieldMetadata') {
      continue;
    }

    setFieldIdIfMissing({
      universalIdentifier: action.flatEntity.universalIdentifier,
      fallbackId: action.id,
    });

    if (isDefined(action.relatedUniversalFlatFieldMetadata)) {
      setFieldIdIfMissing({
        universalIdentifier:
          action.relatedUniversalFlatFieldMetadata.universalIdentifier,
        fallbackId: action.relatedFieldId,
      });
    }
  }

  if (Object.keys(fieldIdByUniversalIdentifier).length === 0) {
    return undefined;
  }

  return fieldIdByUniversalIdentifier;
};

// Extracts a field's junction target field universal identifier from its universal settings, if present
const getJunctionTargetFieldUniversalIdentifier = (
  universalSettings: UniversalCreateFieldAction['flatEntity']['universalSettings'],
): string | null | undefined => {
  if (
    !isDefined(universalSettings) ||
    !('junctionTargetFieldUniversalIdentifier' in universalSettings)
  ) {
    return undefined;
  }

  return universalSettings.junctionTargetFieldUniversalIdentifier;
};

// Builds the subset of the field id map containing only the ids a "create field" action's own relation
// target and junction target fields reference, so the action carries just what it needs
const buildReferencedFieldIdByUniversalIdentifierForFieldAction = ({
  action,
  fieldIdByUniversalIdentifier,
}: {
  action: UniversalCreateFieldAction;
  fieldIdByUniversalIdentifier?: Record<string, string>;
}): Record<string, string> | undefined => {
  if (!isDefined(fieldIdByUniversalIdentifier)) {
    return undefined;
  }

  const referencedFieldIdByUniversalIdentifier: Record<string, string> = {};

  const addReference = (universalIdentifier: string | null | undefined) => {
    if (
      !isDefined(universalIdentifier) ||
      !isDefined(fieldIdByUniversalIdentifier[universalIdentifier])
    ) {
      return;
    }

    referencedFieldIdByUniversalIdentifier[universalIdentifier] =
      fieldIdByUniversalIdentifier[universalIdentifier];
  };

  for (const universalFlatFieldMetadata of [
    action.flatEntity,
    action.relatedUniversalFlatFieldMetadata,
  ].filter(isDefined)) {
    addReference(
      universalFlatFieldMetadata.relationTargetFieldMetadataUniversalIdentifier,
    );
    addReference(
      getJunctionTargetFieldUniversalIdentifier(
        universalFlatFieldMetadata.universalSettings,
      ),
    );
  }

  if (Object.keys(referencedFieldIdByUniversalIdentifier).length === 0) {
    return undefined;
  }

  return referencedFieldIdByUniversalIdentifier;
};

// Rewrites every "create" action in a workspace migration to use pre-resolved ids (from
// idByUniversalIdentifierByMetadataName) instead of freshly generated ones, so a migration that's
// re-run or replayed against a system that already knows some entities' ids stays consistent with them
export const enrichCreateWorkspaceMigrationActionsWithIds = ({
  workspaceMigration,
  idByUniversalIdentifierByMetadataName,
}: {
  workspaceMigration: WorkspaceMigration;
  idByUniversalIdentifierByMetadataName: IdByUniversalIdentifierByMetadataName;
}): WorkspaceMigration => {
  const fieldMetadataIdByUniversalIdentifier =
    idByUniversalIdentifierByMetadataName.fieldMetadata;
  const pageLayoutTabIdByUniversalIdentifier =
    idByUniversalIdentifierByMetadataName.pageLayoutTab;

  const fieldIdByUniversalIdentifier =
    buildFieldIdByUniversalIdentifierForFieldActions({
      actions: workspaceMigration.actions,
      providedFieldIdByUniversalIdentifier:
        fieldMetadataIdByUniversalIdentifier,
    });

  const enrichedActions = workspaceMigration.actions.map((action) => {
    if (action.type !== 'create') {
      return action;
    }

    const idByUniversalIdentifier =
      idByUniversalIdentifierByMetadataName[action.metadataName];

    if (
      action.metadataName !== 'fieldMetadata' &&
      action.metadataName !== 'objectMetadata' &&
      !isDefined(idByUniversalIdentifier) &&
      !isDefined(fieldMetadataIdByUniversalIdentifier) &&
      !isDefined(pageLayoutTabIdByUniversalIdentifier)
    ) {
      return action;
    }

    switch (action.metadataName) {
      case 'objectMetadata': {
        const id =
          (isDefined(idByUniversalIdentifier)
            ? idByUniversalIdentifier[action.flatEntity.universalIdentifier]
            : undefined) ??
          action.id ??
          v4();
        const objectFieldIdByUniversalIdentifier =
          buildFieldIdByUniversalIdentifierForObjectAction({
            action,
            fieldMetadataIdByUniversalIdentifier:
              fieldMetadataIdByUniversalIdentifier ?? {},
          });

        return {
          ...action,
          id,
          fieldIdByUniversalIdentifier: objectFieldIdByUniversalIdentifier,
        };
      }
      case 'fieldMetadata': {
        const typedAction = action as UniversalCreateFieldAction;
        const id =
          fieldIdByUniversalIdentifier?.[
            typedAction.flatEntity.universalIdentifier
          ];

        const relatedFieldId =
          isDefined(typedAction.relatedUniversalFlatFieldMetadata) &&
          isDefined(fieldIdByUniversalIdentifier)
            ? fieldIdByUniversalIdentifier[
                typedAction.relatedUniversalFlatFieldMetadata
                  .universalIdentifier
              ]
            : typedAction.relatedFieldId;

        const referencedFieldIdByUniversalIdentifier =
          buildReferencedFieldIdByUniversalIdentifierForFieldAction({
            action: typedAction,
            fieldIdByUniversalIdentifier,
          });

        return {
          ...typedAction,
          id,
          relatedFieldId,
          ...(isDefined(referencedFieldIdByUniversalIdentifier) && {
            fieldIdByUniversalIdentifier:
              referencedFieldIdByUniversalIdentifier,
          }),
        };
      }
      case 'pageLayout': {
        const id = isDefined(idByUniversalIdentifier)
          ? idByUniversalIdentifier[action.flatEntity.universalIdentifier]
          : undefined;
        const tabIdByUniversalIdentifier = isDefined(
          pageLayoutTabIdByUniversalIdentifier,
        )
          ? buildTabIdByUniversalIdentifier({
              action,
              pageLayoutTabIdByUniversalIdentifier,
            })
          : undefined;

        return {
          ...action,
          id,
          tabIdByUniversalIdentifier,
        };
      }
      case 'view':
      case 'viewField':
      case 'viewGroup':
      case 'viewFieldGroup':
      case 'rowLevelPermissionPredicate':
      case 'rowLevelPermissionPredicateGroup':
      case 'viewFilterGroup':
      case 'index':
      case 'logicFunction':
      case 'viewFilter':
      case 'role':
      case 'roleTarget':
      case 'agent':
      case 'skill':
      case 'pageLayoutWidget':
      case 'pageLayoutTab':
      case 'commandMenuItem':
      case 'navigationMenuItem':
      case 'frontComponent':
      case 'viewSort':
      case 'rolePermissionFlag':
      case 'permissionFlag':
      case 'objectPermission':
      case 'fieldPermission':
      case 'webhook':
      case 'applicationVariable':
      case 'connectionProvider':
      case 'searchFieldMetadata': {
        if (!isDefined(idByUniversalIdentifier)) {
          return action;
        }

        return {
          ...action,
          id: idByUniversalIdentifier[action.flatEntity.universalIdentifier],
        };
      }
      default: {
        assertUnreachable(action);
      }
    }
  });

  return {
    ...workspaceMigration,
    actions: enrichedActions,
  };
};
