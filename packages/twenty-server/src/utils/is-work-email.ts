import { isNonEmptyString } from '@sniptt/guards';

import { emailProvidersSet } from 'src/utils/email-providers';
import { getDomainFromEmail } from 'src/utils/get-domain-from-email';

// True if the email's domain is not a known free/disposable provider.
export const isWorkEmail = (email: string) => {
  const domain = getDomainFromEmail(email);

  return isNonEmptyString(domain) && !emailProvidersSet.has(domain);
};

// True if the domain itself is not a known free/disposable provider.
export const isWorkDomain = (domain: string) => {
  return !emailProvidersSet.has(domain);
};
