const CONFIG_VAR_TEMPLATE_REGEX = /^\{\{(\w+)\}\}$/;

// Extracts the variable name from a `{{VAR_NAME}}` template string, if the
// value matches that exact template form.
export const extractConfigVariableName = (
  value: string | undefined,
): string | undefined => {
  if (!value) {
    return undefined;
  }

  const match = CONFIG_VAR_TEMPLATE_REGEX.exec(value);

  return match?.[1];
};
