import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

// Builds the fixed set of standard view fields for the "databaseConnection" object's views
export const computeStandardDatabaseConnectionViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'databaseConnection'>, 'context'>,
): Record<string, FlatViewField> => {
  return {
    allDatabaseConnectionsName: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'databaseConnection',
      context: {
        viewName: 'allDatabaseConnections',
        viewFieldName: 'name',
        fieldName: 'name',
        position: 0,
        isVisible: true,
        size: 150,
      },
    }),
    allDatabaseConnectionsBaseUrl: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'databaseConnection',
      context: {
        viewName: 'allDatabaseConnections',
        viewFieldName: 'baseUrl',
        fieldName: 'baseUrl',
        position: 1,
        isVisible: true,
        size: 150,
      },
    }),
    allDatabaseConnectionsIsEnabled: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'databaseConnection',
      context: {
        viewName: 'allDatabaseConnections',
        viewFieldName: 'isEnabled',
        fieldName: 'isEnabled',
        position: 2,
        isVisible: true,
        size: 150,
      },
    }),
    allDatabaseConnectionsLastVerificationStatus:
      createStandardViewFieldFlatMetadata({
        ...args,
        objectName: 'databaseConnection',
        context: {
          viewName: 'allDatabaseConnections',
          viewFieldName: 'lastVerificationStatus',
          fieldName: 'lastVerificationStatus',
          position: 3,
          isVisible: true,
          size: 150,
        },
      }),
  };
};
