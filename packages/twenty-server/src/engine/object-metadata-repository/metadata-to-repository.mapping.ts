import { BlocklistRepository } from 'src/modules/blocklist/repositories/blocklist.repository';
import { TimelineActivityRepository } from 'src/modules/timeline/repositories/timeline-activity.repository';

// Maps standard workspace-entity class names to their custom repository
// class, for objects that need bespoke repository methods beyond the
// generic WorkspaceRepository.
export const metadataToRepositoryMapping = {
  BlocklistWorkspaceEntity: BlocklistRepository,
  TimelineActivityWorkspaceEntity: TimelineActivityRepository,
};
