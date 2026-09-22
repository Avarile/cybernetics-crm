import { Field, ObjectType } from '@nestjs/graphql';

import { IsNotEmpty, IsUUID } from 'class-validator';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

// Payload variant for a command menu item that navigates to an object
// metadata item's list/index view.
@ObjectType('ObjectMetadataCommandMenuItemPayload')
export class ObjectMetadataCommandMenuItemPayloadDTO {
  @IsUUID()
  @IsNotEmpty()
  @Field(() => UUIDScalarType)
  objectMetadataItemId: string;
}
