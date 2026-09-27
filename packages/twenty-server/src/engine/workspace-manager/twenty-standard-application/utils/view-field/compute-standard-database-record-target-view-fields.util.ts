import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

// Builds the fixed set of standard view fields for the "databaseRecordTarget" object's views
export const computeStandardDatabaseRecordTargetViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'databaseRecordTarget'>, 'context'>,
): Record<string, FlatViewField> => {
  return {
    allDatabaseRecordTargetsRecordName: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'databaseRecordTarget',
      context: {
        viewName: 'allDatabaseRecordTargets',
        viewFieldName: 'recordName',
        fieldName: 'recordName',
        position: 0,
        isVisible: true,
        size: 150,
      },
    }),
    allDatabaseRecordTargetsTableName: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'databaseRecordTarget',
      context: {
        viewName: 'allDatabaseRecordTargets',
        viewFieldName: 'tableName',
        fieldName: 'tableName',
        position: 1,
        isVisible: true,
        size: 150,
      },
    }),
    allDatabaseRecordTargetsBaseName: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'databaseRecordTarget',
      context: {
        viewName: 'allDatabaseRecordTargets',
        viewFieldName: 'baseName',
        fieldName: 'baseName',
        position: 2,
        isVisible: true,
        size: 150,
      },
    }),
    allDatabaseRecordTargetsSnapshotStatus: createStandardViewFieldFlatMetadata(
      {
        ...args,
        objectName: 'databaseRecordTarget',
        context: {
          viewName: 'allDatabaseRecordTargets',
          viewFieldName: 'snapshotStatus',
          fieldName: 'snapshotStatus',
          position: 3,
          isVisible: true,
          size: 150,
        },
      },
    ),
  };
};
