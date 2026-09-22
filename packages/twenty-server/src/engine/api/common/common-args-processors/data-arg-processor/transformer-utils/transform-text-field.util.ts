import { isNullEquivalentTextFieldValue } from 'src/engine/api/common/common-args-processors/data-arg-processor/utils/is-null-equivalent-text-field-value.util';

// Maps null-equivalent text values (e.g. empty string) to null.
export const transformTextField = (value: string | null): string | null => {
  return isNullEquivalentTextFieldValue(value) ? null : value;
};
