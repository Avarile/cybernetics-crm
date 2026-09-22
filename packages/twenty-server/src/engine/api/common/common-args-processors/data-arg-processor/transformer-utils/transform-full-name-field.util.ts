import { isNull, isUndefined } from '@sniptt/guards';

import { transformTextField } from 'src/engine/api/common/common-args-processors/data-arg-processor/transformer-utils/transform-text-field.util';

// Normalizes a full-name composite field input, transforming firstName and
// lastName as text subfields and leaving undefined ones untouched.
export const transformFullNameField = (
  value: {
    firstName?: string | null;
    lastName?: string | null;
  } | null,
): {
  firstName?: string | null;
  lastName?: string | null;
} | null => {
  if (isNull(value)) return null;

  return {
    firstName: isUndefined(value.firstName)
      ? undefined
      : transformTextField(value.firstName),
    lastName: isUndefined(value.lastName)
      ? undefined
      : transformTextField(value.lastName),
  };
};
