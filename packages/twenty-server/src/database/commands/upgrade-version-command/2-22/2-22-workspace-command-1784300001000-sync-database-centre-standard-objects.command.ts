import { InjectDataSource } from '@nestjs/typeorm';

import { Command } from 'nest-commander';
import { SystemPermissionFlag } from 'twenty-shared/constants';
import {
  STANDARD_OBJECTS,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { getStandardFlatEntitiesToCreateOrThrow } from 'src/database/commands/upgrade-version-command/2-10/utils/get-standard-flat-entities-to-create-or-throw.util';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type FlatIndexMetadata } from 'src/engine/metadata-modules/flat-index-metadata/types/flat-index-metadata.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { type FlatPageLayoutTab } from 'src/engine/metadata-modules/flat-page-layout-tab/types/flat-page-layout-tab.type';
import { type FlatPageLayoutWidget } from 'src/engine/metadata-modules/flat-page-layout-widget/types/flat-page-layout-widget.type';
import { type FlatPermissionFlag } from 'src/engine/metadata-modules/flat-permission-flag/types/flat-permission-flag.type';
import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import { type FlatView } from 'src/engine/metadata-modules/flat-view/types/flat-view.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

const getUniversalIdentifiers = (
  entitiesByName: Record<string, { universalIdentifier: string }>,
): string[] =>
  Object.values(entitiesByName).map((entity) => entity.universalIdentifier);

const DATABASE_CENTRE_OBJECTS = [
  STANDARD_OBJECTS.databaseConnection,
  STANDARD_OBJECTS.databaseRecordTarget,
];

const DATABASE_CENTRE_OBJECT_METADATA_UNIVERSAL_IDENTIFIERS: string[] =
  DATABASE_CENTRE_OBJECTS.map((object) => object.universalIdentifier);

// The new objects' own fields plus the reverse "databaseRecordTargets"
// relation on every covered standard object
const DATABASE_CENTRE_FIELD_METADATA_UNIVERSAL_IDENTIFIERS = [
  ...DATABASE_CENTRE_OBJECTS.flatMap((object) =>
    getUniversalIdentifiers(object.fields),
  ),
  STANDARD_OBJECTS.company.fields.databaseRecordTargets.universalIdentifier,
  STANDARD_OBJECTS.dashboard.fields.databaseRecordTargets.universalIdentifier,
  STANDARD_OBJECTS.note.fields.databaseRecordTargets.universalIdentifier,
  STANDARD_OBJECTS.opportunity.fields.databaseRecordTargets.universalIdentifier,
  STANDARD_OBJECTS.person.fields.databaseRecordTargets.universalIdentifier,
  STANDARD_OBJECTS.task.fields.databaseRecordTargets.universalIdentifier,
  STANDARD_OBJECTS.workflow.fields.databaseRecordTargets.universalIdentifier,
];

const DATABASE_CENTRE_INDEX_UNIVERSAL_IDENTIFIERS =
  DATABASE_CENTRE_OBJECTS.flatMap((object) =>
    getUniversalIdentifiers(object.indexes),
  );

const DATABASE_CENTRE_VIEW_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.databaseConnection.views.allDatabaseConnections
    .universalIdentifier,
  STANDARD_OBJECTS.databaseRecordTarget.views.allDatabaseRecordTargets
    .universalIdentifier,
];

const DATABASE_CENTRE_VIEW_FIELD_UNIVERSAL_IDENTIFIERS = [
  ...getUniversalIdentifiers(
    STANDARD_OBJECTS.databaseConnection.views.allDatabaseConnections.viewFields,
  ),
  ...getUniversalIdentifiers(
    STANDARD_OBJECTS.databaseRecordTarget.views.allDatabaseRecordTargets
      .viewFields,
  ),
];

const DATABASE_TAB_RECORD_PAGES = [
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.companyRecordPage,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.noteRecordPage,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.personRecordPage,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.taskRecordPage,
];

const DATABASE_CENTRE_PERMISSION_FLAG_UNIVERSAL_IDENTIFIERS = [
  SystemPermissionFlag.DATABASE_CENTRE_INTEGRATION,
];

@RegisteredWorkspaceCommand('2.22.0', 1784300001000)
@Command({
  name: 'upgrade:2-22:sync-database-centre-standard-objects',
  description:
    'Create the data centre integration standard metadata (databaseConnection, databaseRecordTarget, Database record page tabs and settings permission) in existing workspaces',
})
export class SyncDatabaseCentreStandardObjectsCommand extends ProvisionedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly applicationService: ApplicationService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly workspaceMigrationValidateBuildAndRunService: WorkspaceMigrationValidateBuildAndRunService,
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    const isDryRun = options.dryRun ?? false;

    const {
      flatObjectMetadataMaps,
      flatFieldMetadataMaps,
      flatIndexMaps,
      flatViewMaps,
      flatViewFieldMaps,
      flatSearchFieldMetadataMaps,
      flatPageLayoutMaps,
      flatPageLayoutTabMaps,
      flatPageLayoutWidgetMaps,
      flatPermissionFlagMaps,
    } = await this.workspaceCacheService.getOrRecompute(workspaceId, [
      'flatObjectMetadataMaps',
      'flatFieldMetadataMaps',
      'flatIndexMaps',
      'flatViewMaps',
      'flatViewFieldMaps',
      'flatSearchFieldMetadataMaps',
      'flatPageLayoutMaps',
      'flatPageLayoutTabMaps',
      'flatPageLayoutWidgetMaps',
      'flatPermissionFlagMaps',
    ]);

    const { twentyStandardFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );

    const { allFlatEntityMaps: standardAllFlatEntityMaps } =
      computeTwentyStandardApplicationAllFlatEntityMaps({
        now: new Date().toISOString(),
        workspaceId,
        twentyStandardApplicationId: twentyStandardFlatApplication.id,
      });

    // A workspace may have removed or replaced a standard record page layout;
    // only add the Database tab to layouts that still exist
    const recordPagesWithExistingLayout = DATABASE_TAB_RECORD_PAGES.filter(
      (recordPage) =>
        isDefined(
          flatPageLayoutMaps.byUniversalIdentifier[
            recordPage.universalIdentifier
          ],
        ),
    );

    const searchFieldMetadataToCreate = Object.values(
      standardAllFlatEntityMaps.flatSearchFieldMetadataMaps
        .byUniversalIdentifier,
    )
      .filter(isDefined)
      .filter(
        (searchFieldMetadata) =>
          DATABASE_CENTRE_OBJECT_METADATA_UNIVERSAL_IDENTIFIERS.includes(
            searchFieldMetadata.objectMetadataUniversalIdentifier,
          ) &&
          !isDefined(
            flatSearchFieldMetadataMaps.byUniversalIdentifier[
              searchFieldMetadata.universalIdentifier
            ],
          ),
      );

    const allFlatEntityOperationByMetadataName = {
      objectMetadata: {
        flatEntityToCreate:
          getStandardFlatEntitiesToCreateOrThrow<FlatObjectMetadata>({
            standardFlatEntityMaps:
              standardAllFlatEntityMaps.flatObjectMetadataMaps,
            existingFlatEntityMaps: flatObjectMetadataMaps,
            universalIdentifiers:
              DATABASE_CENTRE_OBJECT_METADATA_UNIVERSAL_IDENTIFIERS,
          }),
        flatEntityToDelete: [],
        flatEntityToUpdate: [],
      },
      fieldMetadata: {
        flatEntityToCreate:
          getStandardFlatEntitiesToCreateOrThrow<FlatFieldMetadata>({
            standardFlatEntityMaps:
              standardAllFlatEntityMaps.flatFieldMetadataMaps,
            existingFlatEntityMaps: flatFieldMetadataMaps,
            universalIdentifiers:
              DATABASE_CENTRE_FIELD_METADATA_UNIVERSAL_IDENTIFIERS,
          }),
        flatEntityToDelete: [],
        flatEntityToUpdate: [],
      },
      index: {
        flatEntityToCreate:
          getStandardFlatEntitiesToCreateOrThrow<FlatIndexMetadata>({
            standardFlatEntityMaps: standardAllFlatEntityMaps.flatIndexMaps,
            existingFlatEntityMaps: flatIndexMaps,
            universalIdentifiers: DATABASE_CENTRE_INDEX_UNIVERSAL_IDENTIFIERS,
          }),
        flatEntityToDelete: [],
        flatEntityToUpdate: [],
      },
      view: {
        flatEntityToCreate: getStandardFlatEntitiesToCreateOrThrow<FlatView>({
          standardFlatEntityMaps: standardAllFlatEntityMaps.flatViewMaps,
          existingFlatEntityMaps: flatViewMaps,
          universalIdentifiers: DATABASE_CENTRE_VIEW_UNIVERSAL_IDENTIFIERS,
        }),
        flatEntityToDelete: [],
        flatEntityToUpdate: [],
      },
      viewField: {
        flatEntityToCreate:
          getStandardFlatEntitiesToCreateOrThrow<FlatViewField>({
            standardFlatEntityMaps: standardAllFlatEntityMaps.flatViewFieldMaps,
            existingFlatEntityMaps: flatViewFieldMaps,
            universalIdentifiers:
              DATABASE_CENTRE_VIEW_FIELD_UNIVERSAL_IDENTIFIERS,
          }),
        flatEntityToDelete: [],
        flatEntityToUpdate: [],
      },
      searchFieldMetadata: {
        flatEntityToCreate: searchFieldMetadataToCreate,
        flatEntityToDelete: [],
        flatEntityToUpdate: [],
      },
      pageLayoutTab: {
        flatEntityToCreate:
          getStandardFlatEntitiesToCreateOrThrow<FlatPageLayoutTab>({
            standardFlatEntityMaps:
              standardAllFlatEntityMaps.flatPageLayoutTabMaps,
            existingFlatEntityMaps: flatPageLayoutTabMaps,
            universalIdentifiers: recordPagesWithExistingLayout.map(
              (recordPage) => recordPage.tabs.database.universalIdentifier,
            ),
          }),
        flatEntityToDelete: [],
        flatEntityToUpdate: [],
      },
      pageLayoutWidget: {
        flatEntityToCreate:
          getStandardFlatEntitiesToCreateOrThrow<FlatPageLayoutWidget>({
            standardFlatEntityMaps:
              standardAllFlatEntityMaps.flatPageLayoutWidgetMaps,
            existingFlatEntityMaps: flatPageLayoutWidgetMaps,
            universalIdentifiers: recordPagesWithExistingLayout.map(
              (recordPage) =>
                recordPage.tabs.database.widgets.database.universalIdentifier,
            ),
          }),
        flatEntityToDelete: [],
        flatEntityToUpdate: [],
      },
      permissionFlag: {
        flatEntityToCreate:
          getStandardFlatEntitiesToCreateOrThrow<FlatPermissionFlag>({
            standardFlatEntityMaps:
              standardAllFlatEntityMaps.flatPermissionFlagMaps,
            existingFlatEntityMaps: flatPermissionFlagMaps,
            universalIdentifiers:
              DATABASE_CENTRE_PERMISSION_FLAG_UNIVERSAL_IDENTIFIERS,
          }),
        flatEntityToDelete: [],
        flatEntityToUpdate: [],
      },
    };

    const totalOperationCount = Object.values(
      allFlatEntityOperationByMetadataName,
    ).reduce(
      (total, operations) => total + operations.flatEntityToCreate.length,
      0,
    );

    if (totalOperationCount === 0) {
      this.logger.log(
        `Data centre standard metadata already exists for workspace ${workspaceId}, skipping`,
      );

      return;
    }

    if (isDryRun) {
      this.logger.log(
        `[DRY RUN] Would apply ${totalOperationCount} data centre standard metadata operations for workspace ${workspaceId}`,
      );

      return;
    }

    if (
      allFlatEntityOperationByMetadataName.pageLayoutWidget.flatEntityToCreate
        .length > 0
    ) {
      await this.ensureDatabaseWidgetTypeExists();
    }

    // Legacy path, like the other standard-object syncs: the create set comes
    // from the complete static standard definition (system fields included),
    // so the side-effect engine must not inject companions on top of it
    const validateAndBuildResult =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunLegacyWorkspaceMigration(
        {
          isSystemBuild: true,
          applicationUniversalIdentifier:
            twentyStandardFlatApplication.universalIdentifier,
          workspaceId,
          allFlatEntityOperationByMetadataName,
        },
      );

    if (validateAndBuildResult.status === 'fail') {
      throw new Error(
        `Failed to create data centre standard metadata for workspace ${workspaceId}: ${JSON.stringify(
          validateAndBuildResult,
          null,
          2,
        )}`,
      );
    }

    this.logger.log(
      `Applied ${totalOperationCount} data centre standard metadata operations for workspace ${workspaceId}`,
    );
  }

  // Instances that had already completed the 2.22 instance segment when the
  // add-database-widget-type instance command shipped will never run it (the
  // upgrade cursor is past it), so the enum value is ensured here as well.
  // ADD VALUE IF NOT EXISTS is idempotent and runs outside any transaction.
  private async ensureDatabaseWidgetTypeExists(): Promise<void> {
    await this.coreDataSource.query(
      `ALTER TYPE "core"."pageLayoutWidget_type_enum" ADD VALUE IF NOT EXISTS 'DATABASE'`,
    );
  }
}
