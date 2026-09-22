import { isDefined } from 'twenty-shared/utils';

import { MessageFolderImportPolicy } from 'twenty-shared/types';
import { type MessageFolderEntity } from 'src/engine/metadata-modules/message-folder/entities/message-folder.entity';
import { MESSAGING_GMAIL_DEFAULT_EXCLUDED_LABELS } from 'src/modules/messaging/message-import-manager/drivers/gmail/constants/messaging-gmail-default-excluded-labels.constant';
import { MESSAGING_GMAIL_EXCLUDED_SYSTEM_LABELS } from 'src/modules/messaging/message-import-manager/drivers/gmail/constants/messaging-gmail-excluded-system-labels.constant';
import { MESSAGING_GMAIL_FOLDERS_WITH_CATEGORY_EXCLUSIONS } from 'src/modules/messaging/message-import-manager/drivers/gmail/constants/messaging-gmail-folders-with-category-exclusions.constant';
import { buildGmailLabelSearchName } from 'src/modules/messaging/message-import-manager/drivers/gmail/utils/build-gmail-label-search-name.util';
import { computeGmailDefaultNotSyncedLabelsSearchFilter } from 'src/modules/messaging/message-import-manager/drivers/gmail/utils/compute-gmail-default-not-synced-labels-search-filter';

// Builds the Gmail search query used to list which messages to import,
// based on the channel's folder import policy: for ALL_FOLDERS (or when
// every folder is synced), just excludes always-excluded labels; for
// SELECTED_FOLDERS, builds an inclusion query for the synced labels and
// appends either category exclusions (if a custom label was picked) or
// the full default exclusions (if only inbox/important/sent are synced).
export const computeGmailExcludeSearchFilter = (
  messageFolders: Pick<
    MessageFolderEntity,
    'externalId' | 'isSynced' | 'name' | 'parentFolderId'
  >[],
  messageFolderImportPolicy: MessageFolderImportPolicy,
): string => {
  const allExclusions = MESSAGING_GMAIL_DEFAULT_EXCLUDED_LABELS.map(
    computeGmailDefaultNotSyncedLabelsSearchFilter,
  ).join(' ');

  const systemExclusions = MESSAGING_GMAIL_EXCLUDED_SYSTEM_LABELS.map(
    computeGmailDefaultNotSyncedLabelsSearchFilter,
  ).join(' ');

  if (messageFolderImportPolicy === MessageFolderImportPolicy.ALL_FOLDERS) {
    return allExclusions;
  }

  const syncedFolders = messageFolders.filter((folder) => folder.isSynced);

  const allFoldersSynced =
    messageFolders.length > 0 &&
    messageFolders.every((folder) => folder.isSynced);

  if (allFoldersSynced) {
    return allExclusions;
  }

  const labelNamesToInclude = syncedFolders
    .map((folder) => buildGmailLabelSearchName(folder, messageFolders))
    .filter(isDefined);

  if (labelNamesToInclude.length === 0) {
    return '';
  }

  const inclusionQuery =
    labelNamesToInclude.length === 1
      ? `label:${labelNamesToInclude[0]}`
      : `(${labelNamesToInclude.map((name) => `label:${name}`).join(' OR ')})`;

  const hasCustomLabelSelected = syncedFolders.some(
    (folder) =>
      !MESSAGING_GMAIL_FOLDERS_WITH_CATEGORY_EXCLUSIONS.includes(
        folder.externalId ?? '',
      ),
  );

  if (hasCustomLabelSelected) {
    return `${inclusionQuery} ${systemExclusions}`;
  }

  return `${inclusionQuery} ${allExclusions}`;
};
