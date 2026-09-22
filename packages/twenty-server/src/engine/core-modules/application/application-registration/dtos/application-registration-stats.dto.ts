// GraphQL DTOs for an application registration's install stats (active
// installs and version distribution across workspaces).
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('VersionDistributionEntry')
export class VersionDistributionEntryDTO {
  @Field(() => String)
  version: string;

  @Field(() => Int)
  count: number;
}

@ObjectType('ApplicationRegistrationStats')
export class ApplicationRegistrationStatsDTO {
  @Field(() => Int)
  activeInstalls: number;

  @Field(() => String, { nullable: true })
  mostInstalledVersion: string | null;

  @Field(() => [VersionDistributionEntryDTO])
  versionDistribution: VersionDistributionEntryDTO[];
}
