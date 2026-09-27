import { gql } from '@apollo/client';

export const GET_DATABASE_CENTRE_RECORD = gql`
  query GetDatabaseCentreRecord(
    $baseId: String!
    $tableId: String!
    $recordId: String!
  ) {
    databaseCentreRecord(
      baseId: $baseId
      tableId: $tableId
      recordId: $recordId
    ) {
      record {
        id
        name
        fields
        createdTime
        lastModifiedTime
      }
      fields {
        id
        name
        type
        isPrimary
        isLookup
        isMultipleCellValue
        cellValueType
      }
      deepLink
    }
  }
`;
