// Converts JSON tool-result values containing JSON Schema `$ref`/`$defs`
// into plain text, since Gemini rejects those fields in tool results.
import {
  type LanguageModelV3Prompt,
  type LanguageModelV3ToolResultPart,
} from '@ai-sdk/provider';
import { isArray, isObject, isString } from '@sniptt/guards';

// Recursively checks whether a value contains a JSON Schema `$ref` or `$defs` key.
const containsJsonSchemaDefsRef = (value: unknown): boolean => {
  if (isArray(value)) {
    return value.some(containsJsonSchemaDefsRef);
  }

  if (!isObject(value)) {
    return false;
  }

  return (
    ('$ref' in value && isString(value.$ref)) ||
    '$defs' in value ||
    Object.values(value).some(containsJsonSchemaDefsRef)
  );
};

// Serializes a JSON tool-result part to text if its value contains schema refs.
const sanitizeToolResultPart = (
  part: LanguageModelV3ToolResultPart,
): LanguageModelV3ToolResultPart => {
  if (
    (part.output.type !== 'json' && part.output.type !== 'error-json') ||
    !containsJsonSchemaDefsRef(part.output.value)
  ) {
    return part;
  }

  const value = JSON.stringify(part.output.value);

  const providerOptions = part.output.providerOptions
    ? { providerOptions: part.output.providerOptions }
    : {};

  return {
    ...part,
    output:
      part.output.type === 'error-json'
        ? { type: 'error-text', value, ...providerOptions }
        : { type: 'text', value, ...providerOptions },
  };
};

// Sanitizes tool-result parts across all tool messages in a prompt.
export const sanitizeToolResultRefs = (
  prompt: LanguageModelV3Prompt,
): LanguageModelV3Prompt =>
  prompt.map((message) =>
    message.role === 'tool'
      ? { ...message, content: message.content.map(sanitizeToolResultPart) }
      : message,
  );
