import psl from 'psl';
import { capitalize } from 'twenty-shared/utils';

import { isParsedDomain } from 'src/modules/contact-creation-manager/types/is-psl-parsed-domain.type';

// Derives a display-friendly company name by capitalizing the domain's
// second-level label (e.g. "acme.com" -> "Acme").
export const getCompanyNameFromDomainName = (domainName: string) => {
  const result = psl.parse(domainName);

  if (!isParsedDomain(result)) {
    return '';
  }

  return result.sld ? capitalize(result.sld) : '';
};
