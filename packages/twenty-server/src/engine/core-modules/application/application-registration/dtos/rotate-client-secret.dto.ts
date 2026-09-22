// GraphQL DTO returning the new one-time plaintext client secret after
// rotation.
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('RotateClientSecret')
export class RotateClientSecretDTO {
  @Field()
  clientSecret: string;
}
