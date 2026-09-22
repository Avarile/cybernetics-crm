// GraphQL DTO acknowledging an analytics event mutation was dispatched.
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class Analytics {
  @Field(() => Boolean, {
    description: 'Boolean that confirms query was dispatched',
  })
  success: boolean;
}
