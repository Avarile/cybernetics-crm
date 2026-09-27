import { DatabaseRecordsCard } from '@/database-centre/components/DatabaseRecordsCard';
import { useIsDatabaseCentreAvailableInWorkspace } from '@/database-centre/hooks/useIsDatabaseCentreAvailableInWorkspace';
import { type PageLayoutWidget } from '@/page-layout/types/PageLayoutWidget';
import { useLayoutRenderingContext } from '@/ui/layout/contexts/LayoutRenderingContext';
import { SidePanelProvider } from '@/ui/layout/side-panel/contexts/SidePanelContext';
import { styled } from '@linaria/react';

const StyledContainer = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
`;

type DatabaseRecordWidgetProps = {
  widget: PageLayoutWidget;
};

export const DatabaseRecordWidget = ({
  widget: _widget,
}: DatabaseRecordWidgetProps) => {
  const { isInSidePanel } = useLayoutRenderingContext();
  const isAvailableInWorkspace = useIsDatabaseCentreAvailableInWorkspace();

  if (!isAvailableInWorkspace) {
    return null;
  }

  return (
    <SidePanelProvider value={{ isInSidePanel }}>
      <StyledContainer>
        <DatabaseRecordsCard />
      </StyledContainer>
    </SidePanelProvider>
  );
};
