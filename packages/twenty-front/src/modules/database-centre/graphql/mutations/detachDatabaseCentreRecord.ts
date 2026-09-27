import { gql } from '@apollo/client';

export const DETACH_DATABASE_CENTRE_RECORD = gql`
  mutation DetachDatabaseCentreRecord($databaseRecordTargetId: UUID!) {
    detachDatabaseCentreRecord(databaseRecordTargetId: $databaseRecordTargetId)
  }
`;
