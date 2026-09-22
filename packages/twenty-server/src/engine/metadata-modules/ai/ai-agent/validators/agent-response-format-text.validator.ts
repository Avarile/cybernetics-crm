// Validates the plain-text variant of an agent's response format input.
import { IsEnum } from 'class-validator';

export class AgentResponseFormatText {
  @IsEnum(['text'])
  type: 'text';
}
