import { gql } from '@apollo/client';

export const GET_DATABASE_CENTRE_TABLE_SCHEMA = gql`
  query GetDatabaseCentreTableSchema(
    $baseId: String!
    $tableId: String!
    $viewId: String
  ) {
    databaseCentreTableSchema(
      baseId: $baseId
      tableId: $tableId
      viewId: $viewId
    ) {
      fields {
        id
        name
        type
        isPrimary
        isLookup
        isMultipleCellValue
        cellValueType
      }
      views {
        id
        name
        type
      }
    }
  }
`;
