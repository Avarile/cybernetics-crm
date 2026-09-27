import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { createPortal } from 'react-dom';

import { DatabaseCentreRecordsTable } from '@/database-centre/components/DatabaseCentreRecordsTable';
import {
  DatabaseCentreTree,
  type DatabaseCentreSelectedTable,
} from '@/database-centre/components/DatabaseCentreTree';
import { DATABASE_CENTRE_BROWSE_MODAL_ID } from '@/database-centre/constants/DatabaseCentreBrowseModalId';
import { ModalStatefulWrapper } from '@/ui/layout/modal/components/ModalStatefulWrapper';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { isDefined } from 'twenty-shared/utils';
import { IconDatabase } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/input';
import { ModalContent, ModalFooter, ModalHeader } from 'twenty-ui/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledHeader = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledPanes = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[4]};
  height: 60vh;
`;

const StyledTreePane = styled.div`
  border-right: 1px solid ${themeCssVariables.border.color.light};
  flex-shrink: 0;
  overflow-y: auto;
  padding-right: ${themeCssVariables.spacing[2]};
  width: 240px;
`;

const StyledPlaceholder = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex: 1;
  justify-content: center;
`;

const StyledFooterContent = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
  width: 100%;
`;

const StyledSelectionCount = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
`;

const StyledActions = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

type DatabaseCentreBrowseModalProps = {
  maxSelectableCount: number;
  attachedRecordKeys: string[];
  onAttach: (args: {
    baseId: string;
    tableId: string;
    viewId?: string | null;
    recordIds: string[];
  }) => Promise<boolean>;
};

// Two-pane picker: databases/tables on the left, the selected table's
// records on the right. A selection belongs to one table, since an attach
// call targets a single table.
export const DatabaseCentreBrowseModal = ({
  maxSelectableCount,
  attachedRecordKeys,
  onAttach,
}: DatabaseCentreBrowseModalProps) => {
  const { t } = useLingui();
  const { closeModal } = useModal();

  const [selectedTable, setSelectedTable] =
    useState<DatabaseCentreSelectedTable | null>(null);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [isAttaching, setIsAttaching] = useState(false);

  const resetSelection = () => {
    setSelectedTable(null);
    setSelectedRecordIds([]);
  };

  const handleClose = () => {
    resetSelection();
    closeModal(DATABASE_CENTRE_BROWSE_MODAL_ID);
  };

  const handleSelectTable = (table: DatabaseCentreSelectedTable) => {
    setSelectedTable(table);
    setSelectedRecordIds([]);
  };

  const handleToggleRecord = (recordId: string) => {
    setSelectedRecordIds((previousRecordIds) => {
      if (previousRecordIds.includes(recordId)) {
        return previousRecordIds.filter((id) => id !== recordId);
      }

      if (previousRecordIds.length >= maxSelectableCount) {
        return previousRecordIds;
      }

      return [...previousRecordIds, recordId];
    });
  };

  const handleAttach = async () => {
    if (!isDefined(selectedTable) || selectedRecordIds.length === 0) {
      return;
    }

    setIsAttaching(true);

    const isAttached = await onAttach({
      baseId: selectedTable.baseId,
      tableId: selectedTable.tableId,
      viewId: selectedTable.defaultViewId,
      recordIds: selectedRecordIds,
    });

    setIsAttaching(false);

    if (isAttached) {
      handleClose();
    }
  };

  const selectedCount = selectedRecordIds.length;

  return createPortal(
    <ModalStatefulWrapper
      modalInstanceId={DATABASE_CENTRE_BROWSE_MODAL_ID}
      size="extraLarge"
      isClosable
      onClose={resetSelection}
      renderInDocumentBody
    >
      <ModalHeader hasBorderBottom>
        <StyledHeader>
          <IconDatabase size={16} />
          {t`Attach records from the data centre`}
        </StyledHeader>
      </ModalHeader>
      <ModalContent>
        <StyledPanes>
          <StyledTreePane>
            <DatabaseCentreTree
              selectedTableId={selectedTable?.tableId ?? null}
              onSelectTable={handleSelectTable}
            />
          </StyledTreePane>
          {isDefined(selectedTable) ? (
            <DatabaseCentreRecordsTable
              key={selectedTable.tableId}
              selectedTable={selectedTable}
              selectedRecordIds={selectedRecordIds}
              attachedRecordKeys={attachedRecordKeys}
              onToggleRecord={handleToggleRecord}
            />
          ) : (
            <StyledPlaceholder>{t`Select a table to browse its records`}</StyledPlaceholder>
          )}
        </StyledPanes>
      </ModalContent>
      <ModalFooter>
        <StyledFooterContent>
          <StyledSelectionCount>
            {t`${selectedCount} of ${maxSelectableCount} selected`}
          </StyledSelectionCount>
          <StyledActions>
            <Button
              title={t`Cancel`}
              variant="secondary"
              onClick={handleClose}
            />
            <Button
              title={t`Attach ${selectedCount}`}
              variant="primary"
              accent="blue"
              disabled={selectedCount === 0 || isAttaching}
              onClick={handleAttach}
            />
          </StyledActions>
        </StyledFooterContent>
      </ModalFooter>
    </ModalStatefulWrapper>,
    document.body,
  );
};
