// GraphQL representation of an agent's assembled system prompt, broken into
// labeled sections with estimated token counts (for a settings preview UI).
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('AiSystemPromptSection')
export class AiSystemPromptSectionDTO {
  @Field(() => String)
  title: string;

  @Field(() => String)
  content: string;

  @Field(() => Int)
  estimatedTokenCount: number;
}

@ObjectType('AiSystemPromptPreview')
export class AiSystemPromptPreviewDTO {
  @Field(() => [AiSystemPromptSectionDTO])
  sections: AiSystemPromptSectionDTO[];

  @Field(() => Int)
  estimatedTokenCount: number;
}
