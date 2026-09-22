// Returns true if the flat index metadata is a system-generated uniqueness constraint.
export const isSystemUniqueFlatIndexMetadata = (flatIndexMetadata: {
  isSystemSideEffect: boolean;
  isUnique: boolean;
}): boolean =>
  flatIndexMetadata.isSystemSideEffect === true &&
  flatIndexMetadata.isUnique === true;
