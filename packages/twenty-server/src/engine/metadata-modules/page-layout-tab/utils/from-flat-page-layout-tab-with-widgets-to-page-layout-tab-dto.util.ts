import { type FlatPageLayoutTabWithWidgets } from 'src/engine/metadata-modules/flat-page-layout-tab/utils/reconstruct-flat-page-layout-tab-with-widgets.util';
import { type PageLayoutTabDTO } from 'src/engine/metadata-modules/page-layout-tab/dtos/page-layout-tab.dto';
import { fromFlatPageLayoutTabToPageLayoutTabDto } from 'src/engine/metadata-modules/page-layout-tab/utils/from-flat-page-layout-tab-to-page-layout-tab-dto.util';
import { fromFlatPageLayoutWidgetToPageLayoutWidgetDto } from 'src/engine/metadata-modules/page-layout-widget/utils/from-flat-page-layout-widget-to-page-layout-widget-dto.util';

// Converts a flat page layout tab (with its reconstructed widgets) into
// its full GraphQL DTO, including the mapped widget DTOs.
export const fromFlatPageLayoutTabWithWidgetsToPageLayoutTabDto = (
  flatPageLayoutTabWithWidgets: FlatPageLayoutTabWithWidgets,
): PageLayoutTabDTO => {
  const { widgets, ...flatPageLayoutTab } = flatPageLayoutTabWithWidgets;

  return {
    ...fromFlatPageLayoutTabToPageLayoutTabDto(flatPageLayoutTab),
    widgets: widgets.map(fromFlatPageLayoutWidgetToPageLayoutWidgetDto),
  };
};
