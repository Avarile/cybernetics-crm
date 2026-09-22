import { type McpToolAnnotations } from 'src/engine/api/mcp/types/mcp-tool-annotations.type';

// Annotations for MCP tools that mutate state and may have effects
// outside the workspace.
export const MCP_EXECUTE_TOOL_ANNOTATIONS: McpToolAnnotations = {
  readOnlyHint: false,
  openWorldHint: true,
  destructiveHint: true,
};
