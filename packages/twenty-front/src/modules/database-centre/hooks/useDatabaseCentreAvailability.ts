import { useQuery } from '@apollo/client/react';

import { GET_DATABASE_CENTRE_AVAILABILITY } from '@/database-centre/graphql/queries/getDatabaseCentreAvailability';
import { useIsDatabaseCentreAvailableInWorkspace } from '@/database-centre/hooks/useIsDatabaseCentreAvailableInWorkspace';

type GetDatabaseCentreAvailabilityResult = {
  databaseCentreAvailability: {
    isConfigured: boolean;
    isEnabled: boolean;
  };
};

// Adds the connection state (configured and enabled by an admin) on top of
// the workspace-level availability
export const useDatabaseCentreAvailability = () => {
  const isAvailableInWorkspace = useIsDatabaseCentreAvailableInWorkspace();

  const { data, loading } = useQuery<GetDatabaseCentreAvailabilityResult>(
    GET_DATABASE_CENTRE_AVAILABILITY,
    { skip: !isAvailableInWorkspace },
  );

  return {
    isAvailableInWorkspace,
    isConfigured: data?.databaseCentreAvailability.isConfigured ?? false,
    isEnabled: data?.databaseCentreAvailability.isEnabled ?? false,
    loading,
  };
};
