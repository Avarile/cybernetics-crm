import { ModelFamily } from 'src/engine/metadata-modules/ai/ai-models/types/model-family.enum';

// Human-readable display names for each model family.
export const MODEL_FAMILY_LABELS: Record<string, string> = {
  [ModelFamily.GPT]: 'GPT',
  [ModelFamily.CLAUDE]: 'Claude',
  [ModelFamily.GEMINI]: 'Gemini',
  [ModelFamily.MISTRAL]: 'Mistral',
  [ModelFamily.GROK]: 'Grok',
};
