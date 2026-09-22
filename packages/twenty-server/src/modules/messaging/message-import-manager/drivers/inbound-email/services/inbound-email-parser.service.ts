// Parses a raw inbound email (from S3) with postal-mime into the
// pipeline's normalized message shape; always treated as INCOMING with no
// attachments and synthesizes a Message-ID from the S3 key when absent.
import { Injectable } from '@nestjs/common';

import PostalMime, { type Email as ParsedEmail } from 'postal-mime';

import { MessageDirection } from 'src/modules/messaging/common/enums/message-direction.enum';
import { type ParsedInboundMessage } from 'src/modules/messaging/message-import-manager/drivers/inbound-email/types/parsed-inbound-message.type';
import { type MessageWithParticipants } from 'src/modules/messaging/message-import-manager/types/message';
import { extractParticipantsFromParsedEmail } from 'src/modules/messaging/message-import-manager/utils/extract-participants-from-parsed-email.util';
import { extractThreadIdFromParsedEmail } from 'src/modules/messaging/message-import-manager/utils/extract-thread-id-from-parsed-email.util';
import { sanitizeString } from 'src/modules/messaging/message-import-manager/utils/sanitize-string.util';

@Injectable()
export class InboundEmailParserService {
  // Parses the raw MIME buffer and builds the normalized message.
  async parse(
    rawMessage: Buffer,
    s3Key: string,
  ): Promise<ParsedInboundMessage> {
    const parsedEmail = await PostalMime.parse(rawMessage);
    const message = this.buildMessage(parsedEmail, s3Key);

    return { parsed: parsedEmail, message };
  }

  // Maps a parsed email into the pipeline's normalized message shape.
  private buildMessage(
    parsedEmail: ParsedEmail,
    s3Key: string,
  ): MessageWithParticipants {
    return {
      externalId: `inbound-email:${s3Key}`,
      messageThreadExternalId: extractThreadIdFromParsedEmail(parsedEmail),
      headerMessageId: parsedEmail.messageId?.trim() || `inbound-${s3Key}`,
      subject: sanitizeString(parsedEmail.subject || ''),
      text: sanitizeString(parsedEmail.text || ''),
      receivedAt: parsedEmail.date ? new Date(parsedEmail.date) : new Date(),
      direction: MessageDirection.INCOMING,
      attachments: [],
      participants: extractParticipantsFromParsedEmail(parsedEmail),
      isDraft: false,
    };
  }
}
