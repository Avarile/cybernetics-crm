import { Command } from 'nest-commander';
import { TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER } from 'twenty-shared/application';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { capitalize, isDefined } from 'twenty-shared/utils';
import { v4 } from 'uuid';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { type FlatApplication } from 'src/engine/core-modules/application/types/flat-application.type';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { type FlatPageLayoutTab } from 'src/engine/metadata-modules/flat-page-layout-tab/types/flat-page-layout-tab.type';
import { type FlatPageLayoutWidget } from 'src/engine/metadata-modules/flat-page-layout-widget/types/flat-page-layout-widget.type';
import { type FlatPageLayout } from 'src/engine/metadata-modules/flat-page-layout/types/flat-page-layout.type';
import { buildDefaultRelationFlatFieldMetadatasForCustomObject } from 'src/engine/metadata-modules/object-metadata/utils/build-default-relation-flat-field-metadatas-for-custom-object.util';
import { WidgetConfigurationType } from 'src/engine/metadata-modules/page-layout-widget/enums/widget-configuration-type.type';
import { WidgetType } from 'src/engine/metadata-modules/page-layout-widget/enums/widget-type.enum';
import { PageLayoutType } from 'src/engine/metadata-modules/page-layout/enums/page-layout-type.enum';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import {
  TAB_PROPS,
  WIDGET_PROPS,
} from 'src/engine/workspace-manager/twenty-standard-application/constants/standard-page-layout-tabs.template';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

const DATABASE_RECORD_TARGET_UNIVERSAL_IDENTIFIER =
  STANDARD_OBJECTS.databaseRecordTarget.universalIdentifier;

type DatabaseTabToCreate = {
  pageLayoutTab: FlatPageLayoutTab;
  pageLayoutWidget: FlatPageLayoutWidget;
};

// Runs after upgrade:2-22:sync-database-centre-standard-objects, which creates
// the databaseRecordTarget object this command attaches custom objects to.
@RegisteredWorkspaceCommand('2.22.0', 1784300002000)
@Command({
  name: 'upgrade:2-22:add-database-record-target-to-custom-objects',
  description:
    'Give custom objects that predate the data centre integration their databaseRecordTargets relation and Database record page tab',
})
export class AddDatabaseRecordTargetToCustomObjectsCommand extends ProvisionedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly workspaceMigrationValidateBuildAndRunService: WorkspaceMigrationValidateBuildAndRunService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    const isDryRun = options.dryRun ?? false;

    const {
      flatApplicationMaps,
      flatObjectMetadataMaps,
      flatFieldMetadataMaps,
      flatPageLayoutMaps,
      flatPageLayoutTabMaps,
      flatPageLayoutWidgetMaps,
    } = await this.workspaceCacheService.getOrRecompute(workspaceId, [
      'flatApplicationMaps',
      'flatObjectMetadataMaps',
      'flatFieldMetadataMaps',
      'flatPageLayoutMaps',
      'flatPageLayoutTabMaps',
      'flatPageLayoutWidgetMaps',
    ]);

    const databaseRecordTargetObjectMetadata =
      flatObjectMetadataMaps.byUniversalIdentifier[
        DATABASE_RECORD_TARGET_UNIVERSAL_IDENTIFIER
      ];

    if (!isDefined(databaseRecordTargetObjectMetadata)) {
      this.logger.warn(
        `databaseRecordTarget object not found for workspace ${workspaceId}, skipping`,
      );

      return;
    }

    const existingMorphFieldNames = new Set(
      Object.values(flatFieldMetadataMaps.byUniversalIdentifier)
        .filter(isDefined)
        .filter(
          (field) =>
            field.objectMetadataId === databaseRecordTargetObjectMetadata.id,
        )
        .map((field) => field.name),
    );

    const customObjectsMissingRelation = Object.values(
      flatObjectMetadataMaps.byUniversalIdentifier,
    )
      .filter(isDefined)
      .filter(
        (objectMetadata) =>
          objectMetadata.applicationUniversalIdentifier !==
            TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER &&
          !objectMetadata.isSystem &&
          !existingMorphFieldNames.has(
            `target${capitalize(objectMetadata.nameSingular)}`,
          ),
      );

    if (customObjectsMissingRelation.length === 0) {
      return;
    }

    if (isDryRun) {
      this.logger.log(
        `[DRY RUN] Would add databaseRecordTargets to ${customObjectsMissingRelation.length} custom object(s) for workspace ${workspaceId}`,
      );

      return;
    }

    for (const customObjectMetadata of customObjectsMissingRelation) {
      const flatApplication =
        flatApplicationMaps.byId[customObjectMetadata.applicationId];

      if (!isDefined(flatApplication)) {
        this.logger.warn(
          `Application of custom object ${customObjectMetadata.nameSingular} not found in workspace ${workspaceId}, skipping it`,
        );

        continue;
      }

      const {
        standardSourceFlatFieldMetadatas,
        standardTargetFlatFieldMetadatas,
        standardTargetFlatIndexMetadatas,
      } = buildDefaultRelationFlatFieldMetadatasForCustomObject({
        existingFlatObjectMetadataMaps: flatObjectMetadataMaps,
        sourceFlatObjectMetadata: customObjectMetadata,
        flatApplication,
        relationObjectNameSingulars: ['databaseRecordTarget'],
      });

      const databaseTab = this.buildDatabaseTabIfMissing({
        customObjectMetadata,
        flatApplication,
        workspaceId,
        pageLayouts: Object.values(flatPageLayoutMaps.byUniversalIdentifier)
          .filter(isDefined)
          .filter(
            (pageLayout) =>
              pageLayout.objectMetadataId === customObjectMetadata.id &&
              pageLayout.type === PageLayoutType.RECORD_PAGE,
          ),
        pageLayoutTabs: Object.values(
          flatPageLayoutTabMaps.byUniversalIdentifier,
        ).filter(isDefined),
        pageLayoutWidgets: Object.values(
          flatPageLayoutWidgetMaps.byUniversalIdentifier,
        ).filter(isDefined),
      });

      const validateAndBuildResult =
        await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunWorkspaceMigration(
          {
            isSystemBuild: true,
            workspaceId,
            applicationUniversalIdentifier: flatApplication.universalIdentifier,
            allFlatEntityOperationByMetadataName: {
              fieldMetadata: {
                flatEntityToCreate: [
                  ...standardSourceFlatFieldMetadatas,
                  ...standardTargetFlatFieldMetadatas,
                ],
                flatEntityToDelete: [],
                flatEntityToUpdate: [],
              },
              index: {
                flatEntityToCreate: standardTargetFlatIndexMetadatas,
                flatEntityToDelete: [],
                flatEntityToUpdate: [],
              },
              pageLayoutTab: {
                flatEntityToCreate: isDefined(databaseTab)
                  ? [databaseTab.pageLayoutTab]
                  : [],
                flatEntityToDelete: [],
                flatEntityToUpdate: [],
              },
              pageLayoutWidget: {
                flatEntityToCreate: isDefined(databaseTab)
                  ? [databaseTab.pageLayoutWidget]
                  : [],
                flatEntityToDelete: [],
                flatEntityToUpdate: [],
              },
            },
          },
        );

      if (validateAndBuildResult.status === 'fail') {
        throw new Error(
          `Failed to add databaseRecordTargets to custom object ${customObjectMetadata.nameSingular} for workspace ${workspaceId}: ${JSON.stringify(
            validateAndBuildResult,
            null,
            2,
          )}`,
        );
      }

      this.logger.log(
        `Added databaseRecordTargets to custom object ${customObjectMetadata.nameSingular} for workspace ${workspaceId}`,
      );
    }
  }

  // Mirrors the Database tab new custom objects get from
  // computeFlatDefaultRecordPageLayoutToCreate, appended after existing tabs
  private buildDatabaseTabIfMissing({
    customObjectMetadata,
    flatApplication,
    workspaceId,
    pageLayouts,
    pageLayoutTabs,
    pageLayoutWidgets,
  }: {
    customObjectMetadata: FlatObjectMetadata;
    flatApplication: FlatApplication;
    workspaceId: string;
    pageLayouts: FlatPageLayout[];
    pageLayoutTabs: FlatPageLayoutTab[];
    pageLayoutWidgets: FlatPageLayoutWidget[];
  }): DatabaseTabToCreate | null {
    const pageLayout = pageLayouts[0];

    if (!isDefined(pageLayout)) {
      return null;
    }

    const tabsOfLayout = pageLayoutTabs.filter(
      (tab) => tab.pageLayoutId === pageLayout.id,
    );
    const tabIdsOfLayout = new Set(tabsOfLayout.map((tab) => tab.id));

    const hasDatabaseWidget = pageLayoutWidgets.some(
      (widget) =>
        tabIdsOfLayout.has(widget.pageLayoutTabId) &&
        widget.type === WidgetType.DATABASE,
    );

    if (hasDatabaseWidget) {
      return null;
    }

    const now = new Date().toISOString();
    const tabId = v4();
    const tabUniversalIdentifier = v4();
    const widgetId = v4();
    const widgetUniversalIdentifier = v4();

    const lastTabPosition = Math.max(
      0,
      ...tabsOfLayout.map((tab) => tab.position),
    );

    return {
      pageLayoutTab: {
        id: tabId,
        universalIdentifier: tabUniversalIdentifier,
        applicationId: flatApplication.id,
        applicationUniversalIdentifier: flatApplication.universalIdentifier,
        workspaceId,
        title: TAB_PROPS.database.title,
        position: Math.max(TAB_PROPS.database.position, lastTabPosition + 10),
        pageLayoutId: pageLayout.id,
        pageLayoutUniversalIdentifier: pageLayout.universalIdentifier,
        widgetIds: [widgetId],
        widgetUniversalIdentifiers: [widgetUniversalIdentifier],
        isActive: true,
        isSystemSideEffect: true,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        icon: TAB_PROPS.database.icon,
        layoutMode: TAB_PROPS.database.layoutMode,
        overrides: null,
      },
      pageLayoutWidget: {
        id: widgetId,
        universalIdentifier: widgetUniversalIdentifier,
        applicationId: flatApplication.id,
        applicationUniversalIdentifier: flatApplication.universalIdentifier,
        workspaceId,
        pageLayoutTabId: tabId,
        pageLayoutTabUniversalIdentifier: tabUniversalIdentifier,
        title: WIDGET_PROPS.database.title,
        type: WIDGET_PROPS.database.type,
        gridPosition: WIDGET_PROPS.database.gridPosition,
        position: WIDGET_PROPS.database.position,
        configuration: {
          configurationType: WidgetConfigurationType.DATABASE,
        },
        universalConfiguration: {
          configurationType: WidgetConfigurationType.DATABASE,
        },
        objectMetadataId: customObjectMetadata.id,
        objectMetadataUniversalIdentifier:
          customObjectMetadata.universalIdentifier,
        isActive: true,
        isSystemSideEffect: true,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        conditionalDisplay: null,
        conditionalAvailabilityExpression: null,
        overrides: null,
        universalOverrides: null,
      },
    };
  }
}
