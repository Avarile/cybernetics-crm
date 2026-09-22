import { type FlatPageLayoutTab } from 'src/engine/metadata-modules/flat-page-layout-tab/types/flat-page-layout-tab.type';
import { type PageLayoutTabDTO } from 'src/engine/metadata-modules/page-layout-tab/dtos/page-layout-tab.dto';

// Converts a flat page layout tab into its GraphQL DTO (without widgets),
// applying any overrides on top of the base fields and converting
// timestamp strings to Date objects.
export const fromFlatPageLayoutTabToPageLayoutTabDto = (
  flatPageLayoutTab: FlatPageLayoutTab,
): Omit<PageLayoutTabDTO, 'widgets'> => {
  const {
    createdAt,
    updatedAt,
    deletedAt,
    widgetIds: _widgetIds,
    overrides,
    ...rest
  } = flatPageLayoutTab;

  return {
    ...rest,
    ...(overrides ?? {}),
    overrides,
    isOverridden: false,
    createdAt: new Date(createdAt),
    updatedAt: new Date(updatedAt),
    deletedAt: deletedAt ? new Date(deletedAt) : null,
  };
};
