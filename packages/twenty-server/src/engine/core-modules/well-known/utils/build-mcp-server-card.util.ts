// Builds the MCP server discovery card advertising this instance's MCP
// endpoint and supported auth methods.
import { MCP_PROTOCOL_VERSION } from 'src/engine/api/mcp/constants/mcp-protocol-version.const';

type BuildMcpServerCardArgs = {
  baseUrl: string;
  version: string;
};

// Builds the MCP server card payload for this instance's remote endpoint.
export const buildMcpServerCard = ({
  baseUrl,
  version,
}: BuildMcpServerCardArgs) => ({
  $schema:
    'https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json',
  name: 'io.github.avarile/cybernetics-crm',
  version,
  title: 'Cybernetics CRM',
  description:
    'Read and write your Cybernetics CRM data - companies, people, opportunities, tasks, notes and any custom objects - from AI assistants. Tools are discovered at runtime and scoped to the authenticated workspace.',
  websiteUrl: 'https://blog.avarile.com',
  repository: {
    url: 'https://github.com/Avarile/cybernetics-crm',
    source: 'github',
  },
  remotes: [
    {
      type: 'streamable-http',
      url: `${baseUrl}/mcp`,
      supportedProtocolVersions: [MCP_PROTOCOL_VERSION],
      headers: [
        {
          name: 'Authorization',
          description:
            "Optional. Bearer <api-key> for static API-key auth. Omit to use OAuth 2.1, auto-discovered from this host's /.well-known/oauth-protected-resource and /.well-known/oauth-authorization-server.",
          isRequired: false,
          isSecret: true,
        },
      ],
    },
  ],
});
