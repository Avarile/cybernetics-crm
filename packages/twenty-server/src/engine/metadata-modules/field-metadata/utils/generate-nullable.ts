// Remote-created fields are always nullable; otherwise defaults to nullable
// unless the caller explicitly says not to be.
export function generateNullable(
  inputNullableValue?: boolean,
  isRemoteCreation?: boolean,
): boolean {
  if (isRemoteCreation) {
    return true;
  }

  return inputNullableValue ?? true;
}
