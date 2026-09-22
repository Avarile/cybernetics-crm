// Normalizes line endings/whitespace: CRLF to LF, non-breaking to regular
// spaces, strips trailing whitespace per line, collapses 3+ blank lines
// down to one, and trims the result.
export const normalizeMessageText = (text: string): string =>
  text
    .replace(/\r\n?/g, '\n')
    .replace(/ /g, ' ')
    .replace(/[^\S\n]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
