import { isNonEmptyString } from '@sniptt/guards';

import { type ParsedName } from 'src/modules/contact-creation-manager/types/parsed-name.type';

// Splits an email local part (before '+' tag, on '.') into first/last name guesses.
export const getParsedNameFromEmailLocalPart = (
  localPart: string,
): ParsedName => {
  const [withoutPlusAddressTag = ''] = localPart.split('+');
  const parts = withoutPlusAddressTag.split('.').filter(isNonEmptyString);

  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
};
