import { gql } from '@apollo/client';

export const ATTACH_DATABASE_CENTRE_RECORDS = gql`
  mutation AttachDatabaseCentreRecords(
    $input: AttachDatabaseCentreRecordsInput!
  ) {
    attachDatabaseCentreRecords(input: $input)
  }
`;
