import { type FlatViewFieldGroup } from 'src/engine/metadata-modules/flat-view-field-group/types/flat-view-field-group.type';
import {
  createStandardViewFieldGroupFlatMetadata,
  type CreateStandardViewFieldGroupArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field-group/create-standard-view-field-group-flat-metadata.util';

// Builds the fixed set of standard view field groups for the "callRecording" object's views
export const computeStandardCallRecordingViewFieldGroups = (
  args: Omit<CreateStandardViewFieldGroupArgs<'callRecording'>, 'context'>,
): Record<string, FlatViewFieldGroup> => {
  return {
    callRecordingRecordPageFieldsGeneral:
      createStandardViewFieldGroupFlatMetadata({
        ...args,
        objectName: 'callRecording',
        context: {
          viewName: 'callRecordingRecordPageFields',
          viewFieldGroupName: 'general',
          name: 'General',
          position: 0,
          isVisible: true,
        },
      }),
  };
};
