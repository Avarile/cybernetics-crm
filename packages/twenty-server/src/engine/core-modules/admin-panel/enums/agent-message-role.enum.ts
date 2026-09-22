import { registerEnumType } from '@nestjs/graphql';

import { AgentMessageRole } from 'src/engine/metadata-modules/ai/ai-agent-execution/entities/agent-message.entity';

// Registers the existing AgentMessageRole entity enum with GraphQL for use in admin chat DTOs
registerEnumType(AgentMessageRole, {
  name: 'AgentMessageRole',
  description: 'Role of a message in a chat thread',
});
