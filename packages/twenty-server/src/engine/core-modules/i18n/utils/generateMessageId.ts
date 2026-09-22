import crypto from 'crypto';

const UNIT_SEPARATOR = '\u001F';

// Derives a Lingui-compatible message id from source text (and optional context),
// matching Lingui's own hashing scheme so ids line up with the compiled catalogs
export function generateMessageId(msg: string, context = '') {
  return crypto
    .createHash('sha256')
    .update(msg + UNIT_SEPARATOR + (context || ''))
    .digest('base64')
    .slice(0, 6);
}
