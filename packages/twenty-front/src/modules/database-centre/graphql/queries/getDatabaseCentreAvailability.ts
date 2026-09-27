import { gql } from '@apollo/client';

export const GET_DATABASE_CENTRE_AVAILABILITY = gql`
  query GetDatabaseCentreAvailability {
    databaseCentreAvailability {
      isConfigured
      isEnabled
    }
  }
`;
