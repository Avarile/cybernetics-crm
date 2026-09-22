import { capitalize } from 'twenty-shared/utils';

import { type ParsedName } from 'src/modules/contact-creation-manager/types/parsed-name.type';
import { getParsedNameFromDisplayName } from 'src/modules/contact-creation-manager/utils/get-parsed-name-from-display-name.util';
import { getParsedNameFromHandle } from 'src/modules/contact-creation-manager/utils/get-parsed-name-from-handle.util';

// Parses a first/last name preferring the display name, falling back to
// parsing the email handle's local part where the display name is unusable.
export const getFirstNameAndLastNameFromHandleAndDisplayName = (
  handle: string,
  displayName: string,
): ParsedName => {
  const fromDisplayName = getParsedNameFromDisplayName(displayName);
  const fromHandle = getParsedNameFromHandle(handle);

  return {
    firstName: capitalize(fromDisplayName.firstName || fromHandle.firstName),
    lastName: capitalize(fromDisplayName.lastName || fromHandle.lastName),
  };
};
