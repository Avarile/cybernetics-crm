import { Field, ObjectType } from '@nestjs/graphql';

import { MetadataEventDTO } from './metadata-event.dto';
import { ObjectRecordEventDTO } from './object-record-event.dto';

// A record-change event paired with the ids of the subscribed queries it
// matches.
@ObjectType('ObjectRecordEventWithQueryIds')
export class ObjectRecordEventWithQueryIdsDTO {
  @Field(() => [String])
  queryIds: string[];

  @Field(() => ObjectRecordEventDTO)
  objectRecordEvent: ObjectRecordEventDTO;
}

// The batch of events (record changes and metadata changes) delivered to
// one event stream subscription.
@ObjectType('EventSubscription')
export class EventSubscriptionDTO {
  @Field(() => String)
  eventStreamId: string;

  @Field(() => [ObjectRecordEventWithQueryIdsDTO])
  objectRecordEventsWithQueryIds: ObjectRecordEventWithQueryIdsDTO[];

  @Field(() => [MetadataEventDTO])
  metadataEvents: MetadataEventDTO[];
}
