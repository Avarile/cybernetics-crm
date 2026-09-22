import { type McpToolAnnotations } from 'src/engine/api/mcp/types/mcp-tool-annotations.type';

// Annotations for read-only MCP tools that may reach outside the
// workspace (e.g. external/open-world lookups).
export const MCP_OPEN_WORLD_READ_ONLY_TOOL_ANNOTATIONS: McpToolAnnotations = {
  readOnlyHint: true,
  openWorldHint: true,
  destructiveHint: false,
};
