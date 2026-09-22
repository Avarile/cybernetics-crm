import { type FlatViewFieldGroup } from 'src/engine/metadata-modules/flat-view-field-group/types/flat-view-field-group.type';
import {
  createStandardViewFieldGroupFlatMetadata,
  type CreateStandardViewFieldGroupArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field-group/create-standard-view-field-group-flat-metadata.util';

// Builds the fixed set of standard view field groups for the "note" object's views
export const computeStandardNoteViewFieldGroups = (
  args: Omit<CreateStandardViewFieldGroupArgs<'note'>, 'context'>,
): Record<string, FlatViewFieldGroup> => {
  return {
    noteRecordPageFieldsGeneral: createStandardViewFieldGroupFlatMetadata({
      ...args,
      objectName: 'note',
      context: {
        viewName: 'noteRecordPageFields',
        viewFieldGroupName: 'general',
        name: 'General',
        position: 0,
        isVisible: true,
      },
    }),
    noteRecordPageFieldsSystem: createStandardViewFieldGroupFlatMetadata({
      ...args,
      objectName: 'note',
      context: {
        viewName: 'noteRecordPageFields',
        viewFieldGroupName: 'system',
        name: 'System',
        position: 1,
        isVisible: true,
      },
    }),
  };
};
