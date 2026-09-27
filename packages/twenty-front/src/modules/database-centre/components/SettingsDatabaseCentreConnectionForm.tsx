import { useMutation } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { UPSERT_DATABASE_CENTRE_CONNECTION } from '@/database-centre/graphql/mutations/upsertDatabaseCentreConnection';
import { VERIFY_DATABASE_CENTRE_CONNECTION } from '@/database-centre/graphql/mutations/verifyDatabaseCentreConnection';
import { type DatabaseCentreConnection } from '@/database-centre/types/DatabaseCentre';
import { SettingsOptionCardContentToggle } from '@/settings/components/SettingsOptions/SettingsOptionCardContentToggle';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { isDefined } from 'twenty-shared/utils';
import { Tag } from 'twenty-ui/data-display';
import { IconDatabase, IconPlug } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/input';
import { Section } from 'twenty-ui/layout';
import { Card } from 'twenty-ui/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { H2Title } from 'twenty-ui/typography';
import { beautifyPastDateRelativeToNow } from '~/utils/date-utils';

const StyledFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
`;

const StyledActions = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: flex-end;
`;

const StyledStatus = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  margin-right: auto;
`;

const VERIFICATION_STATUS_TAG_COLOR = {
  OK: 'green',
  UNAUTHORIZED: 'red',
  UNREACHABLE: 'orange',
  UNVERIFIED: 'gray',
} as const;

type SettingsDatabaseCentreConnectionFormProps = {
  connection: DatabaseCentreConnection | null;
};

export const SettingsDatabaseCentreConnectionForm = ({
  connection,
}: SettingsDatabaseCentreConnectionFormProps) => {
  const { t } = useLingui();
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();

  const [savedConnection, setSavedConnection] =
    useState<DatabaseCentreConnection | null>(connection);
  const [name, setName] = useState(connection?.name ?? t`Data centre`);
  const [baseUrl, setBaseUrl] = useState(connection?.baseUrl ?? '');
  const [apiToken, setApiToken] = useState('');
  const [isEnabled, setIsEnabled] = useState(connection?.isEnabled ?? true);

  const [upsertConnection, { loading: isSaving }] = useMutation<{
    upsertDatabaseCentreConnection: DatabaseCentreConnection;
  }>(UPSERT_DATABASE_CENTRE_CONNECTION);

  const [verifyConnection, { loading: isVerifying }] = useMutation<{
    verifyDatabaseCentreConnection: {
      status: string;
      message: string;
      basesVisible: number;
      connection: DatabaseCentreConnection;
    };
  }>(VERIFY_DATABASE_CENTRE_CONNECTION);

  const isNewConnection = !isDefined(savedConnection);
  const canSave =
    baseUrl.trim().length > 0 &&
    name.trim().length > 0 &&
    (!isNewConnection || apiToken.length > 0);

  const handleSave = async () => {
    try {
      const result = await upsertConnection({
        variables: {
          input: {
            name,
            baseUrl,
            isEnabled,
            apiToken: apiToken.length > 0 ? apiToken : undefined,
          },
        },
      });

      if (isDefined(result.data)) {
        setSavedConnection(result.data.upsertDatabaseCentreConnection);
        setBaseUrl(result.data.upsertDatabaseCentreConnection.baseUrl);
      }

      setApiToken('');
      enqueueSuccessSnackBar({ message: t`Data centre connection saved` });
    } catch (error) {
      enqueueErrorSnackBar({ apolloError: error as Error });
    }
  };

  const handleVerify = async () => {
    try {
      const result = await verifyConnection();
      const verification = result.data?.verifyDatabaseCentreConnection;

      if (!isDefined(verification)) {
        return;
      }

      setSavedConnection(verification.connection);

      if (verification.status === 'OK') {
        enqueueSuccessSnackBar({
          message: t`Connected: ${verification.basesVisible} database(s) visible`,
        });
      } else {
        enqueueErrorSnackBar({ message: verification.message });
      }
    } catch (error) {
      enqueueErrorSnackBar({ apolloError: error as Error });
    }
  };

  const verificationStatus = (savedConnection?.lastVerificationStatus ??
    'UNVERIFIED') as keyof typeof VERIFICATION_STATUS_TAG_COLOR;

  return (
    <>
      <Section>
        <H2Title
          title={t`Connection`}
          description={t`The cybernetics data centre instance this workspace reads records from`}
        />
        <StyledFields>
          <SettingsTextInput
            instanceId="database-centre-connection-name"
            label={t`Name`}
            value={name}
            onChange={setName}
            fullWidth
          />
          <SettingsTextInput
            instanceId="database-centre-connection-base-url"
            label={t`URL`}
            placeholder="https://data.example.com"
            value={baseUrl}
            onChange={setBaseUrl}
            fullWidth
          />
          <SettingsTextInput
            instanceId="database-centre-connection-api-token"
            label={t`API token`}
            type="password"
            placeholder={
              savedConnection?.tokenFingerprint ??
              t`Paste a personal access token`
            }
            value={apiToken}
            onChange={setApiToken}
            fullWidth
          />
        </StyledFields>
      </Section>
      <Section>
        <Card rounded>
          <SettingsOptionCardContentToggle
            Icon={IconDatabase}
            title={t`Enabled`}
            description={t`Let members browse and attach data centre records`}
            checked={isEnabled}
            onChange={setIsEnabled}
          />
        </Card>
      </Section>
      <StyledActions>
        {!isNewConnection && (
          <StyledStatus>
            <Tag
              color={
                VERIFICATION_STATUS_TAG_COLOR[verificationStatus] ?? 'gray'
              }
              text={verificationStatus}
            />
            {isDefined(savedConnection?.lastVerifiedAt) &&
              beautifyPastDateRelativeToNow(savedConnection.lastVerifiedAt)}
          </StyledStatus>
        )}
        {!isNewConnection && (
          <Button
            Icon={IconPlug}
            title={t`Test connection`}
            variant="secondary"
            disabled={isVerifying}
            onClick={handleVerify}
          />
        )}
        <Button
          title={t`Save`}
          variant="primary"
          accent="blue"
          disabled={!canSave || isSaving}
          onClick={handleSave}
        />
      </StyledActions>
    </>
  );
};
