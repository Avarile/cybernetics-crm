import { ViewKey, ViewType } from 'twenty-shared/types';

import { type FlatView } from 'src/engine/metadata-modules/flat-view/types/flat-view.type';
import {
  createStandardViewFlatMetadata,
  type CreateStandardViewArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view/create-standard-view-flat-metadata.util';

// Builds the fixed set of standard views for the "databaseRecordTarget" object
export const computeStandardDatabaseRecordTargetViews = (
  args: Omit<CreateStandardViewArgs<'databaseRecordTarget'>, 'context'>,
): Record<string, FlatView> => {
  return {
    allDatabaseRecordTargets: createStandardViewFlatMetadata({
      ...args,
      objectName: 'databaseRecordTarget',
      context: {
        viewName: 'allDatabaseRecordTargets',
        name: 'All {objectLabelPlural}',
        type: ViewType.TABLE,
        key: ViewKey.INDEX,
        position: 0,
        icon: 'IconList',
      },
    }),
  };
};
