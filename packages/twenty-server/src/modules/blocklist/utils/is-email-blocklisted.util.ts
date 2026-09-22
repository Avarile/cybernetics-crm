import { getDomainFromEmail } from 'src/utils/get-domain-from-email';

// Checks whether an email matches a blocklist entry, either by exact address
// or by domain (entries prefixed with '@' match the domain and its subdomains).
// The channel's own handle is always exempted.
export const isEmailBlocklisted = (
  channelHandle: string[],
  email: string | null | undefined,
  blocklist: string[],
): boolean => {
  if (!email || channelHandle.includes(email)) {
    return false;
  }

  const domain = getDomainFromEmail(email);

  return blocklist.some((item) => {
    if (item.startsWith('@')) {
      const bareDomain = item.slice(1);

      return (
        domain === bareDomain || (domain?.endsWith(`.${bareDomain}`) ?? false)
      );
    }

    return email === item;
  });
};
