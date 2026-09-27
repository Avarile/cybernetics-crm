import { FieldMetadataType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';

type ValidateEnumValueCompatibilityArgs = {
  workspaceMemberFieldMetadata: FlatFieldMetadata;
  targetFieldMetadata: FlatFieldMetadata;
  predicateValue: unknown;
};

// An RLS predicate can bind its comparison value to the current workspace member's own
// SELECT/MULTI_SELECT field (eg: "records where department = current user's department").
// The two fields' enum option sets are independently configurable and can drift apart,
// so this confirms the member's actual value is still a valid option on the target field
// before it's used — see build-row-level-permission-record-filter.util.ts, which drops
// the predicate (rather than failing) when this returns false.
export const validateEnumValueCompatibility = ({
  workspaceMemberFieldMetadata,
  targetFieldMetadata,
  predicateValue,
}: ValidateEnumValueCompatibilityArgs): boolean => {
  const isWorkspaceMemberFieldEnum =
    workspaceMemberFieldMetadata.type === FieldMetadataType.SELECT ||
    workspaceMemberFieldMetadata.type === FieldMetadataType.MULTI_SELECT;

  const isTargetFieldEnum =
    targetFieldMetadata.type === FieldMetadataType.SELECT ||
    targetFieldMetadata.type === FieldMetadataType.MULTI_SELECT;

  if (!isWorkspaceMemberFieldEnum || !isTargetFieldEnum) {
    return true;
  }

  const targetFieldOptions = targetFieldMetadata.options || [];
  const validTargetValues = new Set(
    targetFieldOptions.map((option) => option.value),
  );

  if (validTargetValues.size === 0) {
    return true;
  }

  const valuesToCheck = Array.isArray(predicateValue)
    ? predicateValue
    : [predicateValue];

  const allValuesAreValid = valuesToCheck.every(
    (value) => isDefined(value) && validTargetValues.has(String(value)),
  );

  return allValuesAreValid;
};
