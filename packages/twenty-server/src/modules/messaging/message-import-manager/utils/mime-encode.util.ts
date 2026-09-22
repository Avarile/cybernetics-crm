// Encodes a string as an RFC 2047 MIME "encoded word" (UTF-8/Base64), for
// use in email headers that may contain non-ASCII characters.
export const mimeEncode = (raw: string) => {
  return `=?UTF-8?B?${Buffer.from(raw).toString('base64')}?=`;
};
