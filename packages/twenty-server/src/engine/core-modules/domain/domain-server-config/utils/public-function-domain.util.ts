import { isNonEmptyString } from '@sniptt/guards';

// Parses a URL string and returns its lowercased hostname, or undefined if invalid
export const getHostnameFromUrlOrUndefined = (
  url?: string | null,
): string | undefined => {
  if (!isNonEmptyString(url)) {
    return undefined;
  }

  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return undefined;
  }
};

// Whether host is a strict subdomain of the public function base domain (not the base itself)
export const isHostUnderPublicFunctionDomain = ({
  host,
  publicDomainBaseHostname,
}: {
  host?: string | null;
  publicDomainBaseHostname?: string;
}): boolean => {
  if (!isNonEmptyString(host) || !isNonEmptyString(publicDomainBaseHostname)) {
    return false;
  }

  const hostname = host.split(':')[0].toLowerCase();
  const base = publicDomainBaseHostname.toLowerCase();

  return hostname !== base && hostname.endsWith(`.${base}`);
};
