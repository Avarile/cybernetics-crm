import { useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { Trans } from '@lingui/react/macro';
import { useState } from 'react';

import { GET_DATABASE_CENTRE_SPACES } from '@/database-centre/graphql/queries/getDatabaseCentreSpaces';
import { GET_DATABASE_CENTRE_TABLES } from '@/database-centre/graphql/queries/getDatabaseCentreTables';
import {
  type DatabaseCentreBase,
  type DatabaseCentreSpace,
  type DatabaseCentreTable,
} from '@/database-centre/types/DatabaseCentre';
import {
  IconChevronDown,
  IconChevronRight,
  IconDatabase,
  IconFolder,
  IconTable,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

export type DatabaseCentreSelectedTable = {
  baseId: string;
  tableId: string;
  tableName: string;
  defaultViewId: string | null;
};

const StyledTree = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  overflow-y: auto;
`;

const StyledSpaceLabel = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[1]}
    ${themeCssVariables.spacing[1]};
`;

const StyledItem = styled.button<{ depth: number; isSelected: boolean }>`
  align-items: center;
  background: ${({ isSelected }) =>
    isSelected ? themeCssVariables.background.transparent.medium : 'none'};
  border: none;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: flex;
  font-family: inherit;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[1]};
  padding-left: ${({ depth }) => `calc(${depth} * 16px + 4px)`};
  text-align: left;
  width: 100%;

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
  }
`;

const StyledHint = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  padding: ${themeCssVariables.spacing[2]};
`;

type DatabaseCentreBaseTablesProps = {
  base: DatabaseCentreBase;
  selectedTableId: string | null;
  onSelectTable: (selectedTable: DatabaseCentreSelectedTable) => void;
};

// Tables load lazily, only once their base is expanded
const DatabaseCentreBaseTables = ({
  base,
  selectedTableId,
  onSelectTable,
}: DatabaseCentreBaseTablesProps) => {
  const { data, loading } = useQuery<
    { databaseCentreTables: DatabaseCentreTable[] },
    { baseId: string }
  >(GET_DATABASE_CENTRE_TABLES, { variables: { baseId: base.id } });

  if (loading) {
    return (
      <StyledHint>
        <Trans>Loading…</Trans>
      </StyledHint>
    );
  }

  return (
    <>
      {(data?.databaseCentreTables ?? []).map((table) => (
        <StyledItem
          key={table.id}
          depth={2}
          isSelected={table.id === selectedTableId}
          onClick={() =>
            onSelectTable({
              baseId: base.id,
              tableId: table.id,
              tableName: table.name,
              defaultViewId: table.defaultViewId,
            })
          }
        >
          <IconTable size={14} />
          {table.name}
        </StyledItem>
      ))}
    </>
  );
};

type DatabaseCentreTreeProps = {
  selectedTableId: string | null;
  onSelectTable: (selectedTable: DatabaseCentreSelectedTable) => void;
};

export const DatabaseCentreTree = ({
  selectedTableId,
  onSelectTable,
}: DatabaseCentreTreeProps) => {
  const [expandedBaseIds, setExpandedBaseIds] = useState<string[]>([]);

  const { data, loading, error } = useQuery<{
    databaseCentreSpaces: DatabaseCentreSpace[];
  }>(GET_DATABASE_CENTRE_SPACES);

  const toggleBase = (baseId: string) => {
    setExpandedBaseIds((previousBaseIds) =>
      previousBaseIds.includes(baseId)
        ? previousBaseIds.filter((id) => id !== baseId)
        : [...previousBaseIds, baseId],
    );
  };

  if (loading) {
    return (
      <StyledHint>
        <Trans>Loading databases…</Trans>
      </StyledHint>
    );
  }

  if (error !== undefined) {
    return <StyledHint>{error.message}</StyledHint>;
  }

  const spaces = data?.databaseCentreSpaces ?? [];

  if (spaces.length === 0) {
    return (
      <StyledHint>
        <Trans>No databases are shared with this connection.</Trans>
      </StyledHint>
    );
  }

  return (
    <StyledTree>
      {spaces.map((space) => (
        <div key={space.id}>
          {space.name.length > 0 && (
            <StyledSpaceLabel>
              <IconFolder size={14} />
              {space.name}
            </StyledSpaceLabel>
          )}
          {space.bases.map((base) => {
            const isExpanded = expandedBaseIds.includes(base.id);

            return (
              <div key={base.id}>
                <StyledItem
                  depth={1}
                  isSelected={false}
                  onClick={() => toggleBase(base.id)}
                >
                  {isExpanded ? (
                    <IconChevronDown size={14} />
                  ) : (
                    <IconChevronRight size={14} />
                  )}
                  <IconDatabase size={14} />
                  {base.name}
                </StyledItem>
                {isExpanded && (
                  <DatabaseCentreBaseTables
                    base={base}
                    selectedTableId={selectedTableId}
                    onSelectTable={onSelectTable}
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </StyledTree>
  );
};
