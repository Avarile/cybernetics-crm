// MCP tool-annotation hints (per the MCP spec) describing a tool's
// side-effect profile to the client.
export type McpToolAnnotations = {
  readOnlyHint: boolean;
  openWorldHint: boolean;
  destructiveHint: boolean;
};
