// Model families used for provider-specific token/behavior handling (e.g.
// reasoning token accounting differs between Claude and other families).
export enum ModelFamily {
  GPT = 'GPT',
  CLAUDE = 'CLAUDE',
  GEMINI = 'GEMINI',
  MISTRAL = 'MISTRAL',
  GROK = 'GROK',
}
