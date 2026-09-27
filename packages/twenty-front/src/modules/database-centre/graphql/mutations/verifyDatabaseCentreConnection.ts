import { gql } from '@apollo/client';

export const VERIFY_DATABASE_CENTRE_CONNECTION = gql`
  mutation VerifyDatabaseCentreConnection {
    verifyDatabaseCentreConnection {
      status
      message
      basesVisible
      connection {
        id
        name
        baseUrl
        tokenFingerprint
        isEnabled
        lastVerifiedAt
        lastVerificationStatus
      }
    }
  }
`;
