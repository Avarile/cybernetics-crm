import { type FlatViewFilterGroup } from 'src/engine/metadata-modules/flat-view-filter-group/types/flat-view-filter-group.type';
import { type ViewFilterGroupDTO } from 'src/engine/metadata-modules/view-filter-group/dtos/view-filter-group.dto';

// Converts a flat view filter group into its GraphQL DTO, converting
// timestamp strings to Date objects.
export const fromFlatViewFilterGroupToViewFilterGroupDto = (
  flatViewFilterGroup: FlatViewFilterGroup,
): ViewFilterGroupDTO => {
  const { createdAt, updatedAt, deletedAt, ...rest } = flatViewFilterGroup;

  return {
    ...rest,
    createdAt: new Date(createdAt),
    updatedAt: new Date(updatedAt),
    deletedAt: deletedAt ? new Date(deletedAt) : null,
  };
};
