import { type MessageDirection } from 'src/modules/messaging/common/enums/message-direction.enum';
import { type MessageParticipantWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-participant.workspace-entity';
import { type MessageWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message.workspace-entity';

// The pipeline's normalized in-flight message shape, before it's been
// persisted (hence externalId/direction/folder ids instead of DB
// relations, and no id/timestamps yet).
export type Message = Omit<
  MessageWorkspaceEntity,
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
  | 'messageChannelMessageAssociations'
  | 'messageParticipants'
  | 'messageThread'
  | 'messageThreadId'
  | 'messageFolders'
  | 'id'
  | 'messageCampaign'
  | 'messageCampaignId'
  | 'deliveryStatus'
> & {
  attachments: {
    filename: string;
  }[];
  externalId: string;
  messageThreadExternalId: string;
  direction: MessageDirection;
  messageFolderIds?: string[];
  messageFolderExternalIds?: string[];
  labelIds?: string[];
};

// A fully-loaded attachment ready to send/persist (as opposed to the
// filename-only metadata carried on an in-flight Message).
export type MessageAttachment = {
  filename: string;
  content: Buffer;
  contentType: string;
};

// A message participant before it's been linked to a persisted message.
export type MessageParticipant = Omit<
  MessageParticipantWorkspaceEntity,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
  | 'personId'
  | 'workspaceMemberId'
  | 'person'
  | 'workspaceMember'
  | 'message'
  | 'messageId'
  | 'messageCampaign'
  | 'messageCampaignId'
>;

// A normalized in-flight message together with its participants — the
// shape parsed messages flow through the import pipeline as.
export type MessageWithParticipants = Message & {
  participants: MessageParticipant[];
};
