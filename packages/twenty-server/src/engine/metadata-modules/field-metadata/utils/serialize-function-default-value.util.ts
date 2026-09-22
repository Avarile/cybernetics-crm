import { type FieldMetadataFunctionDefaultValue } from 'twenty-shared/types';

// Maps a function default value name to its Postgres SQL expression.
export const serializeFunctionDefaultValue = (
  defaultValue?: FieldMetadataFunctionDefaultValue,
) => {
  switch (defaultValue) {
    case 'uuid':
      return 'public.uuid_generate_v4()';
    case 'now':
      return 'now()';
    default:
      return null;
  }
};
