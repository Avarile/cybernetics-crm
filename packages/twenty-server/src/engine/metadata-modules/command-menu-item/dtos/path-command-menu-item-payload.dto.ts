import { Field, ObjectType } from '@nestjs/graphql';

import { IsNotEmpty, IsString } from 'class-validator';

// Payload variant for a command menu item that navigates to a static path.
@ObjectType('PathCommandMenuItemPayload')
export class PathCommandMenuItemPayloadDTO {
  @IsString()
  @IsNotEmpty()
  @Field()
  path: string;
}
