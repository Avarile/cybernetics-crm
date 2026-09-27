import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useIsFeatureEnabled } from '@/workspace/hooks/useIsFeatureEnabled';
import { FeatureFlagKey } from '~/generated-metadata/graphql';

// True once the flag is on and the workspace's metadata has been upgraded
// with the databaseRecordTarget object; says nothing about the connection
export const useIsDatabaseCentreAvailableInWorkspace = () => {
  const isFeatureEnabled = useIsFeatureEnabled(
    FeatureFlagKey.IS_DATABASE_CENTRE_INTEGRATION_ENABLED,
  );

  const { objectMetadataItems } = useObjectMetadataItems();

  const hasDatabaseRecordTargetObject = objectMetadataItems.some(
    (objectMetadataItem) =>
      objectMetadataItem.nameSingular === 'databaseRecordTarget',
  );

  return isFeatureEnabled && hasDatabaseRecordTargetObject;
};
