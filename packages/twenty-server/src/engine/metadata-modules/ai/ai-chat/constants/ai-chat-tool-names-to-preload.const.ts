// Tool names eagerly loaded into an AI chat session (beyond the tools common
// to all providers) so the agent can use them without a discovery round-trip.
import { COMMON_PRELOAD_TOOLS } from 'src/engine/core-modules/tool-provider/constants/common-preload-tools.const';

export const AI_CHAT_TOOL_NAMES_TO_PRELOAD: string[] = [
  ...COMMON_PRELOAD_TOOLS,
  'app_exa_web_search',
];
