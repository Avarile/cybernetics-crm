import { type Email as ParsedEmail } from 'postal-mime';

// Derives a stable thread id for a parsed email: prefers the first
// References header entry (the thread's root message), then In-Reply-To,
// then the message's own Message-ID, and finally a random id as a last
// resort so every message still gets grouped into some thread.
export const extractThreadIdFromParsedEmail = (parsed: ParsedEmail): string => {
  const references = parsed.references;

  if (typeof references === 'string' && references.trim()) {
    const first = references.trim().split(/\s+/)[0];

    if (first) {
      return first;
    }
  }

  if (Array.isArray(references) && references.length > 0) {
    const first = String(references[0]).trim();

    if (first) {
      return first;
    }
  }

  if (parsed.inReplyTo) {
    const inReplyTo = String(parsed.inReplyTo).trim();

    if (inReplyTo) {
      return inReplyTo;
    }
  }

  if (parsed.messageId?.trim()) {
    return parsed.messageId.trim();
  }

  return `thread-${crypto.randomUUID()}`;
};
