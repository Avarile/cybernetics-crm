import { capitalize } from 'twenty-shared/utils';

// Inserts a space before each internal capital (fieldName -> field Name), then
// uppercases the leading letter so single-word input (eg: "name" -> "Name") is
// title-cased too, not just multi-word camelCase.
export const camelToTitleCase = (camelCaseText: string) =>
  capitalize(
    camelCaseText
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase()),
  );
