import { useMutation } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';

import { ATTACH_DATABASE_CENTRE_RECORDS } from '@/database-centre/graphql/mutations/attachDatabaseCentreRecords';
import { DETACH_DATABASE_CENTRE_RECORD } from '@/database-centre/graphql/mutations/detachDatabaseCentreRecord';
import { REFRESH_DATABASE_CENTRE_RECORD_SNAPSHOT } from '@/database-centre/graphql/mutations/refreshDatabaseCentreRecordSnapshot';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { type TargetRecordIdentifier } from '@/ui/layout/contexts/TargetRecordIdentifier';

type AttachDatabaseRecordsArgs = {
  baseId: string;
  tableId: string;
  viewId?: string | null;
  recordIds: string[];
};

// Wraps the attach/detach/refresh mutations for one CRM record; every
// successful call refetches the attached list through onChanged
export const useDatabaseRecordTargetActions = ({
  targetRecord,
  onChanged,
}: {
  targetRecord: TargetRecordIdentifier;
  onChanged: () => void;
}) => {
  const { t } = useLingui();
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();

  const [attachMutation, { loading: isAttaching }] = useMutation<
    { attachDatabaseCentreRecords: string[] },
    { input: Record<string, unknown> }
  >(ATTACH_DATABASE_CENTRE_RECORDS);

  const [detachMutation] = useMutation<
    { detachDatabaseCentreRecord: boolean },
    { databaseRecordTargetId: string }
  >(DETACH_DATABASE_CENTRE_RECORD);

  const [refreshMutation] = useMutation<
    { refreshDatabaseCentreRecordSnapshot: string },
    { databaseRecordTargetId: string }
  >(REFRESH_DATABASE_CENTRE_RECORD_SNAPSHOT);

  const attachDatabaseRecords = async ({
    baseId,
    tableId,
    viewId,
    recordIds,
  }: AttachDatabaseRecordsArgs): Promise<boolean> => {
    try {
      const result = await attachMutation({
        variables: {
          input: {
            targetObjectNameSingular: targetRecord.targetObjectNameSingular,
            targetRecordId: targetRecord.id,
            baseId,
            tableId,
            viewId,
            recordIds,
          },
        },
      });

      const attachedCount =
        result.data?.attachDatabaseCentreRecords.length ?? 0;

      enqueueSuccessSnackBar({
        message: t`${attachedCount} record(s) attached`,
      });
      onChanged();

      return true;
    } catch (error) {
      enqueueErrorSnackBar({ apolloError: error as Error });

      return false;
    }
  };

  const detachDatabaseRecord = async (databaseRecordTargetId: string) => {
    try {
      await detachMutation({ variables: { databaseRecordTargetId } });
      onChanged();
    } catch (error) {
      enqueueErrorSnackBar({ apolloError: error as Error });
    }
  };

  const refreshDatabaseRecord = async (databaseRecordTargetId: string) => {
    try {
      await refreshMutation({ variables: { databaseRecordTargetId } });
      onChanged();
    } catch (error) {
      enqueueErrorSnackBar({ apolloError: error as Error });
    }
  };

  return {
    attachDatabaseRecords,
    detachDatabaseRecord,
    refreshDatabaseRecord,
    isAttaching,
  };
};
