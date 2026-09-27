import { styled } from '@linaria/react';
import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { ActivityList } from '@/activities/components/ActivityList';
import { SkeletonLoader } from '@/activities/components/SkeletonLoader';
import { DatabaseCentreBrowseModal } from '@/database-centre/components/DatabaseCentreBrowseModal';
import { DatabaseCentreRecordViewerModal } from '@/database-centre/components/DatabaseCentreRecordViewerModal';
import { DatabaseRecordTargetRow } from '@/database-centre/components/DatabaseRecordTargetRow';
import { DATABASE_CENTRE_BROWSE_MODAL_ID } from '@/database-centre/constants/DatabaseCentreBrowseModalId';
import { DATABASE_CENTRE_MAX_ATTACHMENTS_PER_RECORD } from '@/database-centre/constants/DatabaseCentreMaxAttachmentsPerRecord';
import { DATABASE_CENTRE_RECORD_VIEWER_MODAL_ID } from '@/database-centre/constants/DatabaseCentreRecordViewerModalId';
import { useDatabaseCentreAvailability } from '@/database-centre/hooks/useDatabaseCentreAvailability';
import { useDatabaseRecordTargetActions } from '@/database-centre/hooks/useDatabaseRecordTargetActions';
import { useDatabaseRecordTargets } from '@/database-centre/hooks/useDatabaseRecordTargets';
import { type DatabaseRecordTarget } from '@/database-centre/types/DatabaseCentre';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useObjectPermissionsForObject } from '@/object-record/hooks/useObjectPermissionsForObject';
import { useTargetRecord } from '@/ui/layout/contexts/useTargetRecord';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { isDefined } from 'twenty-shared/utils';
import {
  AnimatedPlaceholder,
  AnimatedPlaceholderEmptyContainer,
  AnimatedPlaceholderEmptySubTitle,
  AnimatedPlaceholderEmptyTextContainer,
  AnimatedPlaceholderEmptyTitle,
} from 'twenty-ui/feedback';
import { IconPlus } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[6]}
    ${themeCssVariables.spacing[6]};
`;

const StyledTitleBar = styled.h3`
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin: ${themeCssVariables.spacing[4]} 0 0;
`;

const StyledTitle = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledCount = styled.span`
  color: ${themeCssVariables.font.color.light};
  margin-left: ${themeCssVariables.spacing[2]};
`;

export const DatabaseRecordsCard = () => {
  const { t } = useLingui();
  const targetRecord = useTargetRecord();
  const { openModal } = useModal();

  const [viewedDatabaseRecordTarget, setViewedDatabaseRecordTarget] =
    useState<DatabaseRecordTarget | null>(null);

  const {
    isConfigured,
    isEnabled,
    loading: isAvailabilityLoading,
  } = useDatabaseCentreAvailability();

  const { databaseRecordTargets, loading, refetch } =
    useDatabaseRecordTargets(targetRecord);

  const { attachDatabaseRecords, detachDatabaseRecord, refreshDatabaseRecord } =
    useDatabaseRecordTargetActions({
      targetRecord,
      onChanged: () => {
        refetch();
      },
    });

  const { objectMetadataItem: targetObjectMetadataItem } =
    useObjectMetadataItem({
      objectNameSingular: targetRecord.targetObjectNameSingular,
    });

  const { objectMetadataItem: databaseRecordTargetObjectMetadataItem } =
    useObjectMetadataItem({ objectNameSingular: 'databaseRecordTarget' });

  const targetObjectPermissions = useObjectPermissionsForObject(
    targetObjectMetadataItem.id,
  );

  const databaseRecordTargetPermissions = useObjectPermissionsForObject(
    databaseRecordTargetObjectMetadataItem.id,
  );

  const canEdit =
    targetObjectPermissions.canUpdateObjectRecords &&
    databaseRecordTargetPermissions.canUpdateObjectRecords;

  const isConnectionUsable = isConfigured && isEnabled;

  const remainingAttachmentSlots =
    DATABASE_CENTRE_MAX_ATTACHMENTS_PER_RECORD - databaseRecordTargets.length;

  const canAttach =
    canEdit && isConnectionUsable && remainingAttachmentSlots > 0;

  const handleOpenBrowseModal = () => {
    openModal(DATABASE_CENTRE_BROWSE_MODAL_ID);
  };

  const handleView = (databaseRecordTarget: DatabaseRecordTarget) => {
    setViewedDatabaseRecordTarget(databaseRecordTarget);
    openModal(DATABASE_CENTRE_RECORD_VIEWER_MODAL_ID);
  };

  const modals = (
    <>
      {canAttach && (
        <DatabaseCentreBrowseModal
          maxSelectableCount={remainingAttachmentSlots}
          attachedRecordKeys={databaseRecordTargets.map(
            (databaseRecordTarget) =>
              `${databaseRecordTarget.tableId}:${databaseRecordTarget.recordId}`,
          )}
          onAttach={attachDatabaseRecords}
        />
      )}
      {isDefined(viewedDatabaseRecordTarget) && isConnectionUsable && (
        <DatabaseCentreRecordViewerModal
          baseId={viewedDatabaseRecordTarget.baseId}
          tableId={viewedDatabaseRecordTarget.tableId}
          recordId={viewedDatabaseRecordTarget.recordId}
          onClose={() => setViewedDatabaseRecordTarget(null)}
        />
      )}
    </>
  );

  if (
    (loading || isAvailabilityLoading) &&
    databaseRecordTargets.length === 0
  ) {
    return <SkeletonLoader />;
  }

  if (databaseRecordTargets.length === 0) {
    return (
      <AnimatedPlaceholderEmptyContainer>
        <AnimatedPlaceholder type="noRecord" />
        <AnimatedPlaceholderEmptyTextContainer>
          <AnimatedPlaceholderEmptyTitle>
            <Trans>No data centre records</Trans>
          </AnimatedPlaceholderEmptyTitle>
          <AnimatedPlaceholderEmptySubTitle>
            {isConnectionUsable ? (
              <Trans>
                Attach records from the cybernetics data centre to this record.
              </Trans>
            ) : (
              <Trans>
                The data centre connection is not configured. Ask an admin to
                set it up in Settings.
              </Trans>
            )}
          </AnimatedPlaceholderEmptySubTitle>
        </AnimatedPlaceholderEmptyTextContainer>
        {canAttach && (
          <Button
            Icon={IconPlus}
            title={t`Attach records`}
            variant="secondary"
            onClick={handleOpenBrowseModal}
          />
        )}
        {modals}
      </AnimatedPlaceholderEmptyContainer>
    );
  }

  return (
    <StyledContainer>
      <StyledTitleBar>
        <StyledTitle>
          {t`Data centre records`}
          <StyledCount>{databaseRecordTargets.length}</StyledCount>
        </StyledTitle>
        {canAttach && (
          <Button
            Icon={IconPlus}
            size="small"
            variant="secondary"
            title={t`Attach records`}
            onClick={handleOpenBrowseModal}
          />
        )}
      </StyledTitleBar>
      <ActivityList>
        {databaseRecordTargets.map((databaseRecordTarget) => (
          <DatabaseRecordTargetRow
            key={databaseRecordTarget.id}
            databaseRecordTarget={databaseRecordTarget}
            canEdit={canEdit}
            canRefresh={canEdit && isConnectionUsable}
            onView={handleView}
            onRefresh={refreshDatabaseRecord}
            onRemove={detachDatabaseRecord}
          />
        ))}
      </ActivityList>
      {modals}
    </StyledContainer>
  );
};
