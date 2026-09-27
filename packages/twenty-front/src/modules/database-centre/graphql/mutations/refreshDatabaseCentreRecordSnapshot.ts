import { gql } from '@apollo/client';

export const REFRESH_DATABASE_CENTRE_RECORD_SNAPSHOT = gql`
  mutation RefreshDatabaseCentreRecordSnapshot($databaseRecordTargetId: UUID!) {
    refreshDatabaseCentreRecordSnapshot(
      databaseRecordTargetId: $databaseRecordTargetId
    )
  }
`;
