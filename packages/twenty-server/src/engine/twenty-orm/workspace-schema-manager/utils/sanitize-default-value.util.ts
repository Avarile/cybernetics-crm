import { escapeLiteral } from 'src/engine/workspace-manager/workspace-migration/utils/remove-sql-injection.util';

// A DEFAULT value that should be a live SQL function call (not a literal) has to be
// allowlisted here — otherwise it would go through escapeLiteral below and become a
// quoted string instead of an executable expression, which also closes off arbitrary
// function-call injection via a field's default value.
const ALLOWED_DEFAULT_FUNCTIONS = new Set([
  'public.uuid_generate_v4()',
  'now()',
]);

export const sanitizeDefaultValue = (
  defaultValue: string | number | boolean | null,
): string | number | boolean => {
  if (defaultValue === null) {
    return 'NULL';
  }

  if (typeof defaultValue === 'string') {
    if (ALLOWED_DEFAULT_FUNCTIONS.has(defaultValue.toLowerCase())) {
      return defaultValue;
    }

    return escapeLiteral(defaultValue);
  }

  return defaultValue;
};
