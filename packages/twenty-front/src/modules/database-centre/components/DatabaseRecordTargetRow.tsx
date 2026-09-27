import { ActivityRow } from '@/activities/components/ActivityRow';
import { DatabaseRecordTargetDropdown } from '@/database-centre/components/DatabaseRecordTargetDropdown';
import { type DatabaseRecordTarget } from '@/database-centre/types/DatabaseCentre';
import { getDatabaseRecordSnapshotStatusTag } from '@/database-centre/utils/getDatabaseRecordSnapshotStatusTag';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { isDefined } from 'twenty-shared/utils';
import { Tag } from 'twenty-ui/data-display';
import { IconDatabase, IconExternalLink } from 'twenty-ui/icon';
import { LightIconButton } from 'twenty-ui/input';
import { OverflowingTextWithTooltip } from 'twenty-ui/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { beautifyPastDateRelativeToNow } from '~/utils/date-utils';

const StyledLeftContent = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
`;

const StyledTexts = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const StyledName = styled.div`
  color: ${themeCssVariables.font.color.primary};
`;

const StyledSecondaryText = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledRightContent = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
`;

type DatabaseRecordTargetRowProps = {
  databaseRecordTarget: DatabaseRecordTarget;
  canEdit: boolean;
  canRefresh: boolean;
  onView: (databaseRecordTarget: DatabaseRecordTarget) => void;
  onRefresh: (databaseRecordTargetId: string) => void;
  onRemove: (databaseRecordTargetId: string) => void;
};

export const DatabaseRecordTargetRow = ({
  databaseRecordTarget,
  canEdit,
  canRefresh,
  onView,
  onRefresh,
  onRemove,
}: DatabaseRecordTargetRowProps) => {
  const { t } = useLingui();

  const statusTag = getDatabaseRecordSnapshotStatusTag(
    databaseRecordTarget.snapshotStatus,
  );

  const location = [
    databaseRecordTarget.baseName,
    databaseRecordTarget.tableName,
  ]
    .filter((part) => isDefined(part) && part.length > 0)
    .join(' / ');

  const preview = Object.entries(databaseRecordTarget.previewFields ?? {})
    .map(([fieldName, value]) => `${fieldName}: ${value}`)
    .join(' · ');

  const secondaryText = [location, preview]
    .filter((part) => part.length > 0)
    .join(' — ');

  const recordName =
    databaseRecordTarget.recordName !== null &&
    databaseRecordTarget.recordName.length > 0
      ? databaseRecordTarget.recordName
      : t`Untitled record`;

  const handleOpenExternally = (event: React.MouseEvent) => {
    event.stopPropagation();

    if (isDefined(databaseRecordTarget.sourceUrl)) {
      window.open(databaseRecordTarget.sourceUrl, '_blank', 'noopener');
    }
  };

  return (
    <ActivityRow onClick={() => onView(databaseRecordTarget)}>
      <StyledLeftContent>
        <IconDatabase size={16} />
        <StyledTexts>
          <StyledName>
            <OverflowingTextWithTooltip text={recordName} />
          </StyledName>
          {secondaryText.length > 0 && (
            <StyledSecondaryText>
              <OverflowingTextWithTooltip text={secondaryText} />
            </StyledSecondaryText>
          )}
        </StyledTexts>
      </StyledLeftContent>
      <StyledRightContent>
        {isDefined(statusTag) && (
          <Tag color={statusTag.color} text={statusTag.label} />
        )}
        {isDefined(databaseRecordTarget.snapshotAt) && (
          <StyledSecondaryText>
            {beautifyPastDateRelativeToNow(databaseRecordTarget.snapshotAt)}
          </StyledSecondaryText>
        )}
        {isDefined(databaseRecordTarget.sourceUrl) && (
          <LightIconButton
            Icon={IconExternalLink}
            accent="tertiary"
            onClick={handleOpenExternally}
          />
        )}
        <DatabaseRecordTargetDropdown
          databaseRecordTargetId={databaseRecordTarget.id}
          canEdit={canEdit}
          canRefresh={canRefresh}
          onView={() => onView(databaseRecordTarget)}
          onRefresh={() => onRefresh(databaseRecordTarget.id)}
          onRemove={() => onRemove(databaseRecordTarget.id)}
        />
      </StyledRightContent>
    </ActivityRow>
  );
};
