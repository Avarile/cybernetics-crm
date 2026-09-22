// Maps a raw message participant to the timeline participant DTO shape.
import { isDefined } from 'twenty-shared/utils';

import { type TimelineThreadParticipantDTO } from 'src/engine/core-modules/messaging/dtos/timeline-thread-participant.dto';
import { type MessageParticipantWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-participant.workspace-entity';

// Maps a raw message participant entity to the timeline DTO shape,
// preferring linked person/workspace-member names over the raw handle.
export const formatThreadParticipant = (
  threadParticipant: MessageParticipantWorkspaceEntity,
): TimelineThreadParticipantDTO => {
  if (!isDefined(threadParticipant.handle)) {
    throw new Error(
      `Thread participant ${threadParticipant.id} has an empty handle`,
    );
  }

  return {
    personId: threadParticipant.personId,
    workspaceMemberId: threadParticipant.workspaceMemberId,
    firstName:
      threadParticipant.person?.name?.firstName ||
      threadParticipant.workspaceMember?.name.firstName ||
      '',
    lastName:
      threadParticipant.person?.name?.lastName ||
      threadParticipant.workspaceMember?.name.lastName ||
      '',
    displayName:
      threadParticipant.person?.name?.firstName ||
      threadParticipant.person?.name?.lastName ||
      threadParticipant.workspaceMember?.name.firstName ||
      threadParticipant.workspaceMember?.name.lastName ||
      threadParticipant.displayName ||
      threadParticipant.handle ||
      '',
    avatarUrl:
      threadParticipant.person?.avatarUrl ||
      threadParticipant.workspaceMember?.avatarUrl ||
      '',
    handle: threadParticipant.handle,
  };
};
