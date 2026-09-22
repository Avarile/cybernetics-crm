import { type FlatViewFieldGroup } from 'src/engine/metadata-modules/flat-view-field-group/types/flat-view-field-group.type';
import {
  createStandardViewFieldGroupFlatMetadata,
  type CreateStandardViewFieldGroupArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field-group/create-standard-view-field-group-flat-metadata.util';

// Builds the fixed set of standard view field groups for the "blocklist" object's views
export const computeStandardBlocklistViewFieldGroups = (
  args: Omit<CreateStandardViewFieldGroupArgs<'blocklist'>, 'context'>,
): Record<string, FlatViewFieldGroup> => {
  return {
    blocklistRecordPageFieldsGeneral: createStandardViewFieldGroupFlatMetadata({
      ...args,
      objectName: 'blocklist',
      context: {
        viewName: 'blocklistRecordPageFields',
        viewFieldGroupName: 'general',
        name: 'General',
        position: 0,
        isVisible: true,
      },
    }),
    blocklistRecordPageFieldsSystem: createStandardViewFieldGroupFlatMetadata({
      ...args,
      objectName: 'blocklist',
      context: {
        viewName: 'blocklistRecordPageFields',
        viewFieldGroupName: 'system',
        name: 'System',
        position: 1,
        isVisible: true,
      },
    }),
  };
};
