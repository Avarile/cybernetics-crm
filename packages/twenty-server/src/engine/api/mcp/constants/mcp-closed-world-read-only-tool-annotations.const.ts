import { type McpToolAnnotations } from 'src/engine/api/mcp/types/mcp-tool-annotations.type';

// Annotations for read-only MCP tools whose effects are confined to the
// workspace (not the open internet/external systems).
export const MCP_CLOSED_WORLD_READ_ONLY_TOOL_ANNOTATIONS: McpToolAnnotations = {
  readOnlyHint: true,
  openWorldHint: false,
  destructiveHint: false,
};
