import { useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';

import { SettingsDatabaseCentreConnectionForm } from '@/database-centre/components/SettingsDatabaseCentreConnectionForm';
import { GET_DATABASE_CENTRE_CONNECTION } from '@/database-centre/graphql/queries/getDatabaseCentreConnection';
import { type DatabaseCentreConnection } from '@/database-centre/types/DatabaseCentre';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';

export const SettingsDatabaseCentre = () => {
  const { t } = useLingui();

  const { data, loading } = useQuery<{
    databaseCentreConnection: DatabaseCentreConnection | null;
  }>(GET_DATABASE_CENTRE_CONNECTION);

  return (
    <SettingsPageLayout
      title={t`Data Centre`}
      links={[
        {
          children: t`Workspace`,
          href: getSettingsPath(SettingsPath.General),
        },
        { children: t`Data Centre` },
      ]}
    >
      <SettingsPageContainer>
        {!loading && (
          <SettingsDatabaseCentreConnectionForm
            connection={data?.databaseCentreConnection ?? null}
          />
        )}
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};
