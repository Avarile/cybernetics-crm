import { type StepResult, type ToolSet } from 'ai';

const WEB_SEARCH_TOOL_NAME = 'web_search';

// Counts native (provider-executed) web search tool calls across all steps,
// used to bill per-search-call cost separately from token usage.
export const countNativeWebSearchCallsFromSteps = (
  steps: StepResult<ToolSet>[],
): number =>
  steps.reduce(
    (count, step) =>
      count +
      step.toolCalls.filter(
        (toolCall) => toolCall.toolName === WEB_SEARCH_TOOL_NAME,
      ).length,
    0,
  );
