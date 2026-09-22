// Tool categories exposed to agents run from workflow automations, excluding
// interactive/chat-only tool categories.
import { ToolCategory } from 'twenty-shared/ai';

export const WORKFLOW_AGENT_REGISTRY_TOOL_CATEGORIES: ToolCategory[] = [
  ToolCategory.DATABASE_CRUD,
  ToolCategory.ACTION,
];
