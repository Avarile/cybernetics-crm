import { gql } from '@apollo/client';

export const UPSERT_DATABASE_CENTRE_CONNECTION = gql`
  mutation UpsertDatabaseCentreConnection(
    $input: UpsertDatabaseCentreConnectionInput!
  ) {
    upsertDatabaseCentreConnection(input: $input) {
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
