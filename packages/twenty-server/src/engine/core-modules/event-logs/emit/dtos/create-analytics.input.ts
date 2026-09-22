// GraphQL args for submitting a pageview or track analytics event, plus
// type guards distinguishing the two input shapes.
import { ArgsType, Field, registerEnumType } from '@nestjs/graphql';

import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import GraphQLJSON from 'graphql-type-json';

import { TrackEventName } from 'src/engine/core-modules/event-logs/emit/events.type';
import { type PageviewProperties } from 'src/engine/core-modules/event-logs/emit/events/pageview/pageview';

enum AnalyticsType {
  PAGEVIEW = 'pageview',
  TRACK = 'track',
}

registerEnumType(AnalyticsType, {
  name: 'AnalyticsType',
});

@ArgsType()
export class CreateAnalyticsInputV2 {
  @Field(() => AnalyticsType)
  @IsEnum(AnalyticsType)
  type: 'pageview' | 'track';

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  event?: TrackEventName;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  @IsObject()
  properties?: PageviewProperties | Record<string, unknown>;
}

// Narrows a CreateAnalyticsInputV2 to the pageview variant (requires `name`).
export function isPageviewAnalyticsInput(
  input: CreateAnalyticsInputV2,
): input is CreateAnalyticsInputV2 & { name: string } {
  return input.type === 'pageview' && !!input.name;
}

// Narrows a CreateAnalyticsInputV2 to the track variant (requires `event`).
export function isTrackAnalyticsInput(
  input: CreateAnalyticsInputV2,
): input is CreateAnalyticsInputV2 & { event: TrackEventName } {
  return input.type === 'track' && !!input.event;
}
