import { gql } from '@apollo/client';

export const GET_DATABASE_CENTRE_SPACES = gql`
  query GetDatabaseCentreSpaces {
    databaseCentreSpaces {
      id
      name
      bases {
        id
        name
        icon
      }
    }
  }
`;
