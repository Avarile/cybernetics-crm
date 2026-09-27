import { gql } from '@apollo/client';

export const GET_DATABASE_CENTRE_TABLES = gql`
  query GetDatabaseCentreTables($baseId: String!) {
    databaseCentreTables(baseId: $baseId) {
      id
      name
      icon
      description
      defaultViewId
    }
  }
`;
