// Detects known Microsoft Graph client-library error bodies that indicate
// a transient failure (a throttled response or an HTML error page
// returned where JSON was expected) rather than a real API error.
export const isMicrosoftClientTemporaryError = (body: string): boolean => {
  return (
    body.includes('Unexpected token < in JSON at position') ||
    body.includes('ApplicationThrottled 429 error')
  );
};
