// Fetches raw message sources for a set of UIDs from one IMAP folder and
// parses each with postal-mime, returning per-message results (including
// UIDs that failed to fetch or parse) rather than failing the whole batch.
import { Injectable, Logger } from '@nestjs/common';

import { type FetchMessageObject, type ImapFlow } from 'imapflow';
import PostalMime, { type Email as ParsedEmail } from 'postal-mime';

export type MessageParseResult = {
  uid: number;
  parsed: ParsedEmail | null;
  flags?: Set<string>;
  error?: Error;
};

export type FolderParseResult = {
  messages: MessageParseResult[];
  uidValidity: bigint | null;
};

@Injectable()
export class ImapMessageParserService {
  private readonly logger = new Logger(ImapMessageParserService.name);

  // Locks the mailbox, fetches all given UIDs in one batch, and parses
  // each; UIDs the server didn't return (likely deleted) come back as a
  // null-parsed result rather than being dropped silently. On a fetch-level
  // failure, returns an error result for every requested UID.
  async parseMessagesFromFolder(
    messageUids: number[],
    folderPath: string,
    client: ImapFlow,
  ): Promise<FolderParseResult> {
    if (!messageUids.length) {
      return { messages: [], uidValidity: null };
    }

    const lock = await client.getMailboxLock(folderPath);

    try {
      const uidValidity =
        client.mailbox && typeof client.mailbox !== 'boolean'
          ? client.mailbox.uidValidity
          : null;

      const uidSet = messageUids.join(',');
      const startTime = Date.now();

      const messages = await client.fetchAll(
        uidSet,
        { uid: true, source: true, flags: true },
        { uid: true },
      );

      const fetchedUids = new Set<number>();
      const results: MessageParseResult[] = [];

      for (const message of messages) {
        fetchedUids.add(message.uid);
        results.push(await this.parseMessage(message));
      }

      for (const uid of messageUids) {
        if (!fetchedUids.has(uid)) {
          results.push({ uid, parsed: null });
        }
      }

      this.logger.log(
        `Fetched and parsed ${results.length} messages from ${folderPath} in ${Date.now() - startTime}ms`,
      );

      return { messages: results, uidValidity };
    } catch (error) {
      this.logger.error(
        `Failed to parse messages from folder ${folderPath}: ${error.message}`,
      );

      return {
        messages: this.createErrorResults(messageUids, error as Error),
        uidValidity: null,
      };
    } finally {
      lock.release();
    }
  }

  // Parses one fetched message's raw source with postal-mime.
  private async parseMessage(
    message: FetchMessageObject,
  ): Promise<MessageParseResult> {
    const { uid, source, flags } = message;

    if (!source) {
      this.logger.debug(`No source content for message UID ${uid}`);

      return { uid, parsed: null, flags };
    }

    try {
      const parsed = await PostalMime.parse(source);

      return { uid, parsed, flags };
    } catch (error) {
      this.logger.error(`Failed to parse message UID ${uid}: ${error.message}`);

      return { uid, parsed: null, flags, error: error as Error };
    }
  }

  // Builds a null-parsed, errored result for every given UID.
  createErrorResults(
    messageUids: number[],
    error: Error,
  ): MessageParseResult[] {
    return messageUids.map((uid) => ({ uid, parsed: null, error }));
  }
}
