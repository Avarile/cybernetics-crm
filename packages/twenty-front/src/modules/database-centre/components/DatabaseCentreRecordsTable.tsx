import { useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { useDebounce } from 'use-debounce';

import { type DatabaseCentreSelectedTable } from '@/database-centre/components/DatabaseCentreTree';
import { DATABASE_CENTRE_RECORDS_PAGE_SIZE } from '@/database-centre/constants/DatabaseCentreRecordsPageSize';
import { GET_DATABASE_CENTRE_RECORDS } from '@/database-centre/graphql/queries/getDatabaseCentreRecords';
import { GET_DATABASE_CENTRE_TABLE_SCHEMA } from '@/database-centre/graphql/queries/getDatabaseCentreTableSchema';
import {
  type DatabaseCentreField,
  type DatabaseCentreRecordPage,
} from '@/database-centre/types/DatabaseCentre';
import { formatDatabaseCentreCellValue } from '@/database-centre/utils/formatDatabaseCentreCellValue';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';
import { IconChevronLeft, IconChevronRight, IconSearch } from 'twenty-ui/icon';
import { Checkbox, LightIconButton } from 'twenty-ui/input';
import { isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const VISIBLE_SECONDARY_FIELD_COUNT = 4;

const StyledContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
`;

const StyledTableWrapper = styled.div`
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  flex: 1;
  overflow: auto;
`;

const StyledTable = styled.table`
  border-collapse: collapse;
  width: 100%;

  th,
  td {
    border-bottom: 1px solid ${themeCssVariables.border.color.light};
    max-width: 200px;
    overflow: hidden;
    padding: ${themeCssVariables.spacing[2]};
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  th {
    color: ${themeCssVariables.font.color.tertiary};
    font-weight: ${themeCssVariables.font.weight.medium};
  }
`;

const StyledRow = styled.tr<{ isDisabled: boolean }>`
  color: ${({ isDisabled }) =>
    isDisabled
      ? themeCssVariables.font.color.light
      : themeCssVariables.font.color.primary};
  cursor: ${({ isDisabled }) => (isDisabled ? 'default' : 'pointer')};

  &:hover {
    background: ${themeCssVariables.background.transparent.lighter};
  }
`;

const StyledFooter = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  justify-content: space-between;
`;

const StyledPagination = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledHint = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  padding: ${themeCssVariables.spacing[4]};
`;

type DatabaseCentreRecordsTableProps = {
  selectedTable: DatabaseCentreSelectedTable;
  selectedRecordIds: string[];
  attachedRecordKeys: string[];
  onToggleRecord: (recordId: string) => void;
};

export const DatabaseCentreRecordsTable = ({
  selectedTable,
  selectedRecordIds,
  attachedRecordKeys,
  onToggleRecord,
}: DatabaseCentreRecordsTableProps) => {
  const { t } = useLingui();
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 300);
  const [skip, setSkip] = useState(0);

  const viewId = selectedTable.defaultViewId;

  const { data: schemaData } = useQuery<{
    databaseCentreTableSchema: { fields: DatabaseCentreField[] };
  }>(GET_DATABASE_CENTRE_TABLE_SCHEMA, {
    variables: {
      baseId: selectedTable.baseId,
      tableId: selectedTable.tableId,
      viewId,
    },
  });

  const { data, loading, error } = useQuery<{
    databaseCentreRecords: DatabaseCentreRecordPage;
  }>(GET_DATABASE_CENTRE_RECORDS, {
    variables: {
      input: {
        baseId: selectedTable.baseId,
        tableId: selectedTable.tableId,
        viewId,
        search: debouncedSearch.length > 0 ? debouncedSearch : undefined,
        take: DATABASE_CENTRE_RECORDS_PAGE_SIZE,
        skip,
      },
    },
  });

  const fields = schemaData?.databaseCentreTableSchema.fields ?? [];
  const primaryField = fields.find((field) => field.isPrimary);
  const secondaryFields = fields
    .filter((field) => !field.isPrimary)
    .slice(0, VISIBLE_SECONDARY_FIELD_COUNT);

  const records = data?.databaseCentreRecords.records ?? [];
  const totalCount = data?.databaseCentreRecords.totalCount ?? records.length;
  const hasPreviousPage = skip > 0;
  const hasNextPage = skip + DATABASE_CENTRE_RECORDS_PAGE_SIZE < totalCount;
  const pageStart = totalCount === 0 ? 0 : skip + 1;
  const pageEnd = Math.min(skip + records.length, totalCount);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setSkip(0);
  };

  return (
    <StyledContainer>
      <SettingsTextInput
        instanceId={`database-centre-records-search-${selectedTable.tableId}`}
        LeftIcon={IconSearch}
        placeholder={t`Search ${selectedTable.tableName}`}
        value={search}
        onChange={handleSearchChange}
        fullWidth
      />
      <StyledTableWrapper>
        {isDefined(error) ? (
          <StyledHint>{error.message}</StyledHint>
        ) : loading && records.length === 0 ? (
          <StyledHint>
            <Trans>Loading records…</Trans>
          </StyledHint>
        ) : records.length === 0 ? (
          <StyledHint>
            <Trans>No records found.</Trans>
          </StyledHint>
        ) : (
          <StyledTable>
            <thead>
              <tr>
                <th />
                <th>{primaryField?.name ?? t`Name`}</th>
                {secondaryFields.map((field) => (
                  <th key={field.id}>{field.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const isAttached = attachedRecordKeys.includes(
                  `${selectedTable.tableId}:${record.id}`,
                );
                const isSelected = selectedRecordIds.includes(record.id);

                return (
                  <StyledRow
                    key={record.id}
                    isDisabled={isAttached}
                    onClick={() => !isAttached && onToggleRecord(record.id)}
                  >
                    <td>
                      <Checkbox
                        checked={isAttached || isSelected}
                        disabled={isAttached}
                      />
                    </td>
                    <td>
                      {record.name.length > 0
                        ? record.name
                        : formatDatabaseCentreCellValue(
                            isDefined(primaryField)
                              ? record.fields[primaryField.id]
                              : undefined,
                          )}
                    </td>
                    {secondaryFields.map((field) => (
                      <td key={field.id}>
                        {formatDatabaseCentreCellValue(record.fields[field.id])}
                      </td>
                    ))}
                  </StyledRow>
                );
              })}
            </tbody>
          </StyledTable>
        )}
      </StyledTableWrapper>
      <StyledFooter>
        <span>
          <Trans>
            {pageStart}–{pageEnd} of {totalCount}
          </Trans>
        </span>
        <StyledPagination>
          <LightIconButton
            Icon={IconChevronLeft}
            disabled={!hasPreviousPage}
            onClick={() =>
              setSkip((previousSkip) =>
                Math.max(0, previousSkip - DATABASE_CENTRE_RECORDS_PAGE_SIZE),
              )
            }
          />
          <LightIconButton
            Icon={IconChevronRight}
            disabled={!hasNextPage}
            onClick={() =>
              setSkip(
                (previousSkip) =>
                  previousSkip + DATABASE_CENTRE_RECORDS_PAGE_SIZE,
              )
            }
          />
        </StyledPagination>
      </StyledFooter>
    </StyledContainer>
  );
};
