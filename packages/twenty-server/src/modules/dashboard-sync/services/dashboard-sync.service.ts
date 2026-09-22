import { Injectable, Logger } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { findFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util';
import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { PageLayoutType } from 'src/engine/metadata-modules/page-layout/enums/page-layout-type.enum';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';

// Dashboards store their content in a page layout, so editing a layout's
// tab/widget doesn't directly touch the dashboard row. This service walks
// from a changed layout/tab/widget back up to its dashboard(s) and bumps
// their updatedAt, so consumers see the dashboard as recently modified.
@Injectable()
export class DashboardSyncService {
  private readonly logger = new Logger(DashboardSyncService.name);

  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly workspaceManyOrAllFlatEntityMapsCacheService: WorkspaceManyOrAllFlatEntityMapsCacheService,
  ) {}

  // Checks whether a page layout is a dashboard layout (vs. some other
  // layout type), since only dashboard layouts need updatedAt propagation.
  private async isPageLayoutOfTypeDashboard({
    pageLayoutId,
    workspaceId,
  }: {
    pageLayoutId: string;
    workspaceId: string;
  }): Promise<boolean> {
    const { flatPageLayoutMaps } =
      await this.workspaceManyOrAllFlatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        {
          workspaceId,
          flatMapsKeys: ['flatPageLayoutMaps'],
        },
      );

    const pageLayout = findFlatEntityByIdInFlatEntityMaps({
      flatEntityId: pageLayoutId,
      flatEntityMaps: flatPageLayoutMaps,
    });

    return (
      isDefined(pageLayout) && pageLayout.type === PageLayoutType.DASHBOARD
    );
  }

  // Bumps updatedAt on every dashboard backed by the given page layout, if
  // that layout is in fact a dashboard layout.
  async updateLinkedDashboardsUpdatedAtByPageLayoutId({
    pageLayoutId,
    workspaceId,
    updatedAt,
  }: {
    pageLayoutId: string;
    workspaceId: string;
    updatedAt: Date;
  }): Promise<void> {
    const isDashboard = await this.isPageLayoutOfTypeDashboard({
      pageLayoutId,
      workspaceId,
    });

    if (!isDashboard) {
      return;
    }

    const authContext = buildSystemAuthContext(workspaceId);

    try {
      await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
        async () => {
          const dashboardRepository =
            await this.globalWorkspaceOrmManager.getRepository(
              workspaceId,
              'dashboard',
              { shouldBypassPermissionChecks: true },
            );

          await dashboardRepository.update({ pageLayoutId }, { updatedAt });
        },
        authContext,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update dashboard updatedAt for page layout ${pageLayoutId}: ${error}`,
      );
    }
  }

  // Resolves a tab up to its page layout and bumps the linked dashboard(s)' updatedAt.
  async updateLinkedDashboardsUpdatedAtByTabId({
    tabId,
    workspaceId,
    updatedAt,
  }: {
    tabId: string;
    workspaceId: string;
    updatedAt: Date;
  }): Promise<void> {
    const { flatPageLayoutTabMaps, flatPageLayoutMaps } =
      await this.workspaceManyOrAllFlatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        {
          workspaceId,
          flatMapsKeys: ['flatPageLayoutTabMaps', 'flatPageLayoutMaps'],
        },
      );

    const tab = findFlatEntityByIdInFlatEntityMaps({
      flatEntityId: tabId,
      flatEntityMaps: flatPageLayoutTabMaps,
    });

    if (!isDefined(tab)) {
      return;
    }

    const pageLayout = findFlatEntityByIdInFlatEntityMaps({
      flatEntityId: tab.pageLayoutId,
      flatEntityMaps: flatPageLayoutMaps,
    });

    if (
      !isDefined(pageLayout) ||
      pageLayout.type !== PageLayoutType.DASHBOARD
    ) {
      return;
    }

    await this.updateLinkedDashboardsUpdatedAtByPageLayoutId({
      pageLayoutId: tab.pageLayoutId,
      workspaceId,
      updatedAt,
    });
  }

  // Resolves a widget up through its tab to its page layout and bumps the
  // linked dashboard(s)' updatedAt.
  async updateLinkedDashboardsUpdatedAtByWidgetId({
    widgetId,
    workspaceId,
    updatedAt,
  }: {
    widgetId: string;
    workspaceId: string;
    updatedAt: Date;
  }): Promise<void> {
    const {
      flatPageLayoutWidgetMaps,
      flatPageLayoutTabMaps,
      flatPageLayoutMaps,
    } =
      await this.workspaceManyOrAllFlatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        {
          workspaceId,
          flatMapsKeys: [
            'flatPageLayoutWidgetMaps',
            'flatPageLayoutTabMaps',
            'flatPageLayoutMaps',
          ],
        },
      );

    const widget = findFlatEntityByIdInFlatEntityMaps({
      flatEntityId: widgetId,
      flatEntityMaps: flatPageLayoutWidgetMaps,
    });

    if (!isDefined(widget)) {
      return;
    }

    const tab = findFlatEntityByIdInFlatEntityMaps({
      flatEntityId: widget.pageLayoutTabId,
      flatEntityMaps: flatPageLayoutTabMaps,
    });

    if (!isDefined(tab)) {
      return;
    }

    const pageLayout = findFlatEntityByIdInFlatEntityMaps({
      flatEntityId: tab.pageLayoutId,
      flatEntityMaps: flatPageLayoutMaps,
    });

    if (
      !isDefined(pageLayout) ||
      pageLayout.type !== PageLayoutType.DASHBOARD
    ) {
      return;
    }

    await this.updateLinkedDashboardsUpdatedAtByPageLayoutId({
      pageLayoutId: tab.pageLayoutId,
      workspaceId,
      updatedAt,
    });
  }
}
