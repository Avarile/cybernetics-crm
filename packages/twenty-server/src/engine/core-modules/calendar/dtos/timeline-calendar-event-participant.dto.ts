// GraphQL DTO for a participant on a timeline calendar event, linked to
// either a CRM person or a workspace member.
import { Field, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ObjectType('TimelineCalendarEventParticipant')
export class TimelineCalendarEventParticipantDTO {
  @Field(() => UUIDScalarType, { nullable: true })
  personId: string | null;

  @Field(() => UUIDScalarType, { nullable: true })
  workspaceMemberId: string | null;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  displayName: string;

  @Field()
  avatarUrl: string;

  @Field()
  handle: string;
}
