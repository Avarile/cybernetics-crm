// Builds ActorMetadata for changes attributed to an installed application.
import { type ActorMetadata, FieldActorSource } from 'twenty-shared/types';

import { type FlatApplication } from 'src/engine/core-modules/application/types/flat-application.type';

type BuildCreatedByFromApplicationArgs = {
  application: FlatApplication;
};
// Builds ActorMetadata attributing a change to an installed application.
export const buildCreatedByFromApplication = ({
  application,
}: BuildCreatedByFromApplicationArgs): ActorMetadata => ({
  source: FieldActorSource.APPLICATION,
  name: application.name,
  workspaceMemberId: null,
  context: {},
});
