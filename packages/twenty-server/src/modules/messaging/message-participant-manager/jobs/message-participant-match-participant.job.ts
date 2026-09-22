// Matches message participants (by person email or workspace member) to
// their corresponding CRM records, linking newly created/updated people
// or workspace members back to already-imported messages.
import { Scope } from '@nestjs/common';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MatchParticipantService } from 'src/modules/match-participant/match-participant.service';
import { type MessageParticipantWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-participant.workspace-entity';

export type MessageParticipantMatchParticipantJobData = {
  workspaceId: string;
  participantMatching: {
    personIds: string[];
    personEmails: string[];
    workspaceMemberIds: string[];
  };
};

@Processor({
  queueName: MessageQueue.messagingQueue,
  scope: Scope.REQUEST,
})
export class MessageParticipantMatchParticipantJob {
  constructor(
    private readonly matchParticipantService: MatchParticipantService<MessageParticipantWorkspaceEntity>,
  ) {}

  // Runs person-based matching when person ids/emails are given, and
  // workspace-member-based matching when workspace member ids are given.
  @Process(MessageParticipantMatchParticipantJob.name)
  async handle(data: MessageParticipantMatchParticipantJobData): Promise<void> {
    const { participantMatching, workspaceId } = data;

    if (
      participantMatching.personIds.length > 0 ||
      participantMatching.personEmails.length > 0
    ) {
      await this.matchParticipantService.matchParticipantsForPeople({
        participantMatching,
        objectMetadataName: 'messageParticipant',
        workspaceId,
      });
    }

    if (participantMatching.workspaceMemberIds.length > 0) {
      await this.matchParticipantService.matchParticipantsForWorkspaceMembers({
        participantMatching,
        objectMetadataName: 'messageParticipant',
        workspaceId,
      });
    }
  }
}
