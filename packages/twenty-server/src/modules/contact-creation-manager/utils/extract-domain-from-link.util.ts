// Strips protocol and "www." from a URL, returning just the host/domain.
export const extractDomainFromLink = (link: string) => {
  const domain = link.replace(/^(https?:\/\/)?(www\.)?/i, '').split('/')[0];

  return domain;
};
