import { getActivityTargetObjectFieldIdName } from '@/activities/utils/getActivityTargetObjectFieldIdName';
import { type DatabaseRecordTarget } from '@/database-centre/types/DatabaseCentre';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type TargetRecordIdentifier } from '@/ui/layout/contexts/TargetRecordIdentifier';

// databaseRecordTarget uses the same "target<Object>Id" morph join columns as
// attachments, notes and tasks
export const useDatabaseRecordTargets = (
  targetRecord: TargetRecordIdentifier,
) => {
  const targetFieldIdName = getActivityTargetObjectFieldIdName({
    nameSingular: targetRecord.targetObjectNameSingular,
  });

  const { records, loading, refetch } =
    useFindManyRecords<DatabaseRecordTarget>({
      objectNameSingular: 'databaseRecordTarget',
      filter: {
        [targetFieldIdName]: {
          eq: targetRecord.id,
        },
      },
      orderBy: [
        {
          createdAt: 'DescNullsFirst',
        },
      ],
    });

  return {
    databaseRecordTargets: records,
    loading,
    refetch,
  };
};
