import { gql } from '@apollo/client';

export const GET_DATABASE_CENTRE_RECORDS = gql`
  query GetDatabaseCentreRecords($input: DatabaseCentreRecordsQueryInput!) {
    databaseCentreRecords(input: $input) {
      records {
        id
        name
        fields
        createdTime
        lastModifiedTime
      }
      take
      skip
      totalCount
    }
  }
`;
