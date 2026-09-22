// Result of a single non-interactive agent execution, including token usage
// and cost data used for billing.
import { type LanguageModelUsage, type StepResult, type ToolSet } from 'ai';

export interface AgentExecutionResult {
  result: object;
  usage: LanguageModelUsage;
  cacheCreationTokens: number;
  nativeWebSearchCallCount: number;
  hasNoMoreAvailableCredits: boolean;
  steps?: StepResult<ToolSet>[];
  modelId?: string;
  totalCostInDollars?: number;
  creditsUsedMicro?: number;
}
