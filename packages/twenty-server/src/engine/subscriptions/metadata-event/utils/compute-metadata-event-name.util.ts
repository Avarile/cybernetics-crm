import { type MetadataEvent } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-runner/types/metadata-event';

// Must stay in this shape: MetadataEventsToDbListener subscribes via the wildcard
// patterns 'metadata.*.created' / '.updated' / '.deleted'.
export const computeMetadataEventName = ({
  metadataName,
  type,
}: Pick<MetadataEvent, 'metadataName' | 'type'>) =>
  `metadata.${metadataName}.${type}` as const;
