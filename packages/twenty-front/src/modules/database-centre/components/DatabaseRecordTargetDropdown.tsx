import { Dropdown } from '@/ui/layout/dropdown/components/Dropdown';
import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { DropdownMenuItemsContainer } from '@/ui/layout/dropdown/components/DropdownMenuItemsContainer';
import { GenericDropdownContentWidth } from '@/ui/layout/dropdown/constants/GenericDropdownContentWidth';
import { useCloseDropdown } from '@/ui/layout/dropdown/hooks/useCloseDropdown';
import { useLingui } from '@lingui/react/macro';
import {
  IconDotsVertical,
  IconEye,
  IconRefresh,
  IconTrash,
} from 'twenty-ui/icon';
import { LightIconButton } from 'twenty-ui/input';
import { MenuItem } from 'twenty-ui/navigation';

type DatabaseRecordTargetDropdownProps = {
  databaseRecordTargetId: string;
  canRemove: boolean;
  canRefresh: boolean;
  onView: () => void;
  onRefresh: () => void;
  onRemove: () => void;
};

export const DatabaseRecordTargetDropdown = ({
  databaseRecordTargetId,
  canRemove,
  canRefresh,
  onView,
  onRefresh,
  onRemove,
}: DatabaseRecordTargetDropdownProps) => {
  const { t } = useLingui();
  const dropdownId = `${databaseRecordTargetId}-database-record-target-dropdown`;

  const { closeDropdown } = useCloseDropdown();

  const handleItemClick = (action: () => void) => () => {
    action();
    closeDropdown(dropdownId);
  };

  return (
    <Dropdown
      dropdownId={dropdownId}
      clickableComponent={
        <LightIconButton Icon={IconDotsVertical} accent="tertiary" />
      }
      dropdownComponents={
        <DropdownContent widthInPixels={GenericDropdownContentWidth.Narrow}>
          <DropdownMenuItemsContainer>
            <MenuItem
              text={t`View`}
              LeftIcon={IconEye}
              onClick={handleItemClick(onView)}
            />
            {canRefresh && (
              <MenuItem
                text={t`Refresh`}
                LeftIcon={IconRefresh}
                onClick={handleItemClick(onRefresh)}
              />
            )}
            {canRemove && (
              <MenuItem
                text={t`Remove`}
                accent="danger"
                LeftIcon={IconTrash}
                onClick={handleItemClick(onRemove)}
              />
            )}
          </DropdownMenuItemsContainer>
        </DropdownContent>
      }
    />
  );
};
