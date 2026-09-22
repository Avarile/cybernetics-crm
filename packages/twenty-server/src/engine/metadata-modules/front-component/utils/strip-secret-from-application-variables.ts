import { type FlatApplicationVariable } from 'src/engine/metadata-modules/flat-application-variable/types/flat-application-variable.type';

// Reduces a list of flat application variables to a key/value record,
// omitting any marked as secret so they're never exposed to the client.
export const stripSecretFromApplicationVariables = (
  flatApplicationVariables: FlatApplicationVariable[],
): Record<string, string> => {
  return flatApplicationVariables.reduce<Record<string, string>>(
    (acc, flatApplicationVariable) => {
      if (flatApplicationVariable.isSecret) {
        return acc;
      }

      acc[flatApplicationVariable.key] = String(
        flatApplicationVariable.value ?? '',
      );

      return acc;
    },
    {},
  );
};
