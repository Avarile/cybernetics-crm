import { buildPublicConnectionParameters } from 'src/engine/core-modules/imap-smtp-caldav-connection/utils/build-public-connection-parameters.util';
import { type ConnectedAccountPublicDTO } from 'src/engine/metadata-modules/connected-account/dtos/connected-account-public.dto';
import { type ConnectedAccountEntity } from 'src/engine/metadata-modules/connected-account/entities/connected-account.entity';

// Converts a connected account entity to its client-safe public DTO by
// redacting connection parameter secrets. Preserves null through.
export function buildPublicConnectedAccount(
  account: ConnectedAccountEntity,
): ConnectedAccountPublicDTO;
export function buildPublicConnectedAccount(
  account: ConnectedAccountEntity | null,
): ConnectedAccountPublicDTO | null;
export function buildPublicConnectedAccount(
  account: ConnectedAccountEntity | null,
): ConnectedAccountPublicDTO | null {
  if (!account) {
    return null;
  }

  return {
    ...account,
    connectionParameters: buildPublicConnectionParameters(
      account.connectionParameters,
    ),
  };
}
