// Validates the JSON-schema variant of an agent's response format input.
import { IsEnum, IsNotEmpty, IsObject } from 'class-validator';

export class AgentResponseFormatJson {
  @IsEnum(['json'])
  type: 'json';

  @IsObject()
  @IsNotEmpty()
  schema: Record<string, unknown>;
}
