// Builds ActorMetadata for changes attributed to an API key.
import { type ActorMetadata, FieldActorSource } from 'twenty-shared/types';

import { type FlatApiKey } from 'src/engine/core-modules/api-key/types/flat-api-key.type';

type BuildCreatedByFromApiKeyArgs = {
  apiKey: FlatApiKey;
};
// Builds ActorMetadata attributing a change to an API key.
export const buildCreatedByFromApiKey = ({
  apiKey,
}: BuildCreatedByFromApiKeyArgs): ActorMetadata => ({
  source: FieldActorSource.API,
  name: apiKey.name,
  workspaceMemberId: null,
  context: {},
});
