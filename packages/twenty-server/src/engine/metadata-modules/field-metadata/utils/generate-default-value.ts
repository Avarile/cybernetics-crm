import {
  FieldActorSource,
  type FieldMetadataDefaultValue,
  FieldMetadataType,
} from 'twenty-shared/types';

// Produces the built-in default value for a field type, if it has one (e.g.
// actor fields default to a system actor); most types have no default.
// No need to refactor as unused in workspace migration v2
export function generateDefaultValue(
  type: FieldMetadataType,
): FieldMetadataDefaultValue {
  switch (type) {
    case FieldMetadataType.ACTOR:
      return {
        source: `'${FieldActorSource.MANUAL}'`,
        name: "'System'",
        workspaceMemberId: null,
      } satisfies FieldMetadataDefaultValue<FieldMetadataType.ACTOR>;
    default:
      return null;
  }
}
