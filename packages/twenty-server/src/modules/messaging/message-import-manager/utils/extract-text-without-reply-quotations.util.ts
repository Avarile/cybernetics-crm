import { isNonEmptyString } from '@sniptt/guards';
import EmailReplyParser from 'email-reply-parser';

// Strips quoted reply/forward fragments from a message body, falling back
// to the original text if stripping would leave nothing (e.g. a
// forwarded message that's entirely quoted content).
export const extractTextWithoutReplyQuotations = (text: string): string => {
  const textWithoutQuotations = new EmailReplyParser()
    .read(text)
    .getFragments()
    .filter((fragment) => !fragment.isQuoted())
    .map((fragment) => fragment.getContent())
    .join('\n');

  return isNonEmptyString(textWithoutQuotations.trim())
    ? textWithoutQuotations
    : text;
};
