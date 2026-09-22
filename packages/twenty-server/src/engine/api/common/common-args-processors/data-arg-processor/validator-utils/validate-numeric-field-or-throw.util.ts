import { isNull } from '@sniptt/guards';

import { validateNumberFieldOrThrow } from 'src/engine/api/common/common-args-processors/data-arg-processor/validator-utils/validate-number-field-or-throw.util';

//Need to handle stringified numbers because of BigFloatScalarType custom gql type
// Validates a NUMERIC field input, which may arrive as a string because of
// the BigFloat GraphQL scalar; returns the original value if it converts to
// a valid finite number.
export const validateNumericFieldOrThrow = (
  value: unknown,
  fieldName: string,
): number | string | null => {
  if (value === '' || isNull(value)) return null;

  const numberValue = Number(value);

  validateNumberFieldOrThrow(numberValue, fieldName);

  return value as number | string;
};
