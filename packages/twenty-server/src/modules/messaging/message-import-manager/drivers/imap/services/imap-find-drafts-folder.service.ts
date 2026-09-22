// Locates the account's Drafts folder (by IMAP special-use flag, then by
// name pattern), creating one named "Drafts" if neither is found.
import { Injectable, Logger } from '@nestjs/common';

import { type ImapFlow, type ListResponse } from 'imapflow';

import { StandardFolder } from 'src/modules/messaging/message-import-manager/drivers/types/standard-folder';
import { getStandardFolderByRegex } from 'src/modules/messaging/message-import-manager/drivers/utils/get-standard-folder-by-regex';

type DraftsFolderResult = {
  name: string;
  path: string;
} | null;

@Injectable()
export class ImapFindDraftsFolderService {
  private readonly logger = new Logger(ImapFindDraftsFolderService.name);

  // Tries special-use flag, then name-pattern matching, then creates a new
  // "Drafts" mailbox; returns null if all attempts fail.
  public async findOrCreateDraftsFolder(
    client: ImapFlow,
  ): Promise<DraftsFolderResult> {
    try {
      const list = await client.list();

      const specialUseDraftsFolder = this.findDraftsFolderBySpecialUse(list);

      if (specialUseDraftsFolder) {
        return specialUseDraftsFolder;
      }

      const regexDraftsFolder = this.findDraftsFolderByRegex(list);

      if (regexDraftsFolder) {
        return regexDraftsFolder;
      }

      return await this.createDraftsFolder(client);
    } catch (error) {
      this.logger.error(
        `Error finding drafts folder: ${error instanceof Error ? error.message : error}`,
      );

      return null;
    }
  }

  // Finds a folder flagged \Drafts per the IMAP special-use extension.
  private findDraftsFolderBySpecialUse(
    list: ListResponse[],
  ): DraftsFolderResult {
    for (const folder of list) {
      if (folder.specialUse && folder.specialUse.includes('\\Drafts')) {
        this.logger.debug(
          `Found drafts folder via special-use flag: ${folder.path}`,
        );

        return {
          name: folder.name,
          path: folder.path,
        };
      }
    }

    return null;
  }

  // Finds a folder whose name matches the drafts standard-folder pattern.
  private findDraftsFolderByRegex(list: ListResponse[]): DraftsFolderResult {
    for (const folder of list) {
      if (getStandardFolderByRegex(folder.name) === StandardFolder.DRAFTS) {
        this.logger.debug(
          `Found drafts folder via pattern match: ${folder.path}`,
        );

        return {
          name: folder.name,
          path: folder.path,
        };
      }
    }

    return null;
  }

  // Creates a new mailbox named "Drafts" as a last resort.
  private async createDraftsFolder(
    client: ImapFlow,
  ): Promise<DraftsFolderResult> {
    try {
      await client.mailboxCreate('Drafts');

      this.logger.debug('Created drafts folder: Drafts');

      return {
        name: 'Drafts',
        path: 'Drafts',
      };
    } catch (error) {
      this.logger.error(
        `Failed to create drafts folder: ${error instanceof Error ? error.message : error}`,
      );

      return null;
    }
  }
}
