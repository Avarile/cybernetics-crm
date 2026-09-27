import { gql } from '@apollo/client';

export const GET_DATABASE_CENTRE_CONNECTION = gql`
  query GetDatabaseCentreConnection {
    databaseCentreConnection {
      id
      name
      baseUrl
      tokenFingerprint
      isEnabled
      lastVerifiedAt
      lastVerificationStatus
    }
  }
`;
