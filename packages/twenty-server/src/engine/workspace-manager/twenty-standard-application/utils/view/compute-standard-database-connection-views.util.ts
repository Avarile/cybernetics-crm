import { ViewKey, ViewType } from 'twenty-shared/types';

import { type FlatView } from 'src/engine/metadata-modules/flat-view/types/flat-view.type';
import {
  createStandardViewFlatMetadata,
  type CreateStandardViewArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view/create-standard-view-flat-metadata.util';

// Builds the fixed set of standard views for the "databaseConnection" object
export const computeStandardDatabaseConnectionViews = (
  args: Omit<CreateStandardViewArgs<'databaseConnection'>, 'context'>,
): Record<string, FlatView> => {
  return {
    allDatabaseConnections: createStandardViewFlatMetadata({
      ...args,
      objectName: 'databaseConnection',
      context: {
        viewName: 'allDatabaseConnections',
        name: 'All {objectLabelPlural}',
        type: ViewType.TABLE,
        key: ViewKey.INDEX,
        position: 0,
        icon: 'IconList',
      },
    }),
  };
};
