import { MessageParticipantRole } from 'twenty-shared/types';

import { type MessageParticipantWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-participant.workspace-entity';

// Keeps only participants with the FROM role (message senders).
export const filterActiveParticipants = (
  participants: MessageParticipantWorkspaceEntity[],
): MessageParticipantWorkspaceEntity[] => {
  return participants.filter(
    (participant) => participant.role === MessageParticipantRole.FROM,
  );
};
