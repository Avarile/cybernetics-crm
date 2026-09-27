import { useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { Trans, useLingui } from '@lingui/react/macro';
import { Fragment } from 'react';
import { createPortal } from 'react-dom';

import { DATABASE_CENTRE_RECORD_VIEWER_MODAL_ID } from '@/database-centre/constants/DatabaseCentreRecordViewerModalId';
import { GET_DATABASE_CENTRE_RECORD } from '@/database-centre/graphql/queries/getDatabaseCentreRecord';
import { type DatabaseCentreRecordDetail } from '@/database-centre/types/DatabaseCentre';
import { formatDatabaseCentreCellValue } from '@/database-centre/utils/formatDatabaseCentreCellValue';
import { ModalStatefulWrapper } from '@/ui/layout/modal/components/ModalStatefulWrapper';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { IconExternalLink, IconX } from 'twenty-ui/icon';
import { Button, IconButton } from 'twenty-ui/input';
import { ModalContent, ModalHeader } from 'twenty-ui/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledHeader = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

const StyledTitle = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledHeaderActions = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledFieldList = styled.dl`
  display: grid;
  gap: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[4]};
  grid-template-columns: minmax(120px, 1fr) 3fr;
  margin: 0;
`;

const StyledFieldName = styled.dt`
  color: ${themeCssVariables.font.color.tertiary};
`;

const StyledFieldValue = styled.dd`
  color: ${themeCssVariables.font.color.primary};
  margin: 0;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
`;

const StyledHint = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
`;

type DatabaseCentreRecordViewerModalProps = {
  baseId: string;
  tableId: string;
  recordId: string;
  onClose: () => void;
};

// Read-only, live view of one data-centre record, as opposed to the
// snapshot stored on the attachment
export const DatabaseCentreRecordViewerModal = ({
  baseId,
  tableId,
  recordId,
  onClose,
}: DatabaseCentreRecordViewerModalProps) => {
  const { t } = useLingui();
  const { closeModal } = useModal();

  const { data, loading, error } = useQuery<{
    databaseCentreRecord: DatabaseCentreRecordDetail;
  }>(GET_DATABASE_CENTRE_RECORD, {
    variables: { baseId, tableId, recordId },
  });

  const recordDetail = data?.databaseCentreRecord;

  const handleClose = () => {
    closeModal(DATABASE_CENTRE_RECORD_VIEWER_MODAL_ID);
    onClose();
  };

  return createPortal(
    <ModalStatefulWrapper
      modalInstanceId={DATABASE_CENTRE_RECORD_VIEWER_MODAL_ID}
      size="large"
      isClosable
      onClose={onClose}
      renderInDocumentBody
    >
      <ModalHeader hasBorderBottom>
        <StyledHeader>
          <StyledTitle>
            {recordDetail?.record.name ?? t`Data centre record`}
          </StyledTitle>
          <StyledHeaderActions>
            {recordDetail !== undefined && (
              <Button
                Icon={IconExternalLink}
                title={t`Open in data centre`}
                size="small"
                variant="secondary"
                onClick={() =>
                  window.open(recordDetail.deepLink, '_blank', 'noopener')
                }
              />
            )}
            <IconButton Icon={IconX} size="small" onClick={handleClose} />
          </StyledHeaderActions>
        </StyledHeader>
      </ModalHeader>
      <ModalContent>
        {loading ? (
          <StyledHint>
            <Trans>Loading record…</Trans>
          </StyledHint>
        ) : error !== undefined ? (
          <StyledHint>{error.message}</StyledHint>
        ) : recordDetail !== undefined ? (
          <StyledFieldList>
            {recordDetail.fields.map((field) => (
              <Fragment key={field.id}>
                <StyledFieldName>{field.name}</StyledFieldName>
                <StyledFieldValue>
                  {formatDatabaseCentreCellValue(
                    recordDetail.record.fields[field.id],
                  )}
                </StyledFieldValue>
              </Fragment>
            ))}
          </StyledFieldList>
        ) : null}
      </ModalContent>
    </ModalStatefulWrapper>,
    document.body,
  );
};
