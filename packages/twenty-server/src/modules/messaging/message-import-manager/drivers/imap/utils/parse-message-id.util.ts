export type ParsedMessageId = {
  folder: string;
  uid: number;
};

const MESSAGE_ID_REGEX = /^(.+):(\d+)$/;

// Splits a "folder:uid" external message id back into its parts.
export function parseMessageId(messageId: string): ParsedMessageId | null {
  const match = MESSAGE_ID_REGEX.exec(messageId);

  if (!match) {
    return null;
  }

  const [, folder, uidStr] = match;
  const uid = Number(uidStr);

  if (!Number.isInteger(uid)) {
    return null;
  }

  return { folder, uid };
}
