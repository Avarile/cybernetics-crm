import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

// The API token is write-only: it's never part of this DTO, only its fingerprint
@ObjectType('DatabaseCentreConnection')
export class DatabaseConnectionDTO {
  @Field(() => UUIDScalarType)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  baseUrl: string;

  @Field(() => String, { nullable: true })
  tokenFingerprint: string | null;

  @Field(() => Boolean)
  isEnabled: boolean;

  @Field(() => String, { nullable: true })
  lastVerifiedAt: string | null;

  @Field(() => String)
  lastVerificationStatus: string;
}

@InputType('UpsertDatabaseCentreConnectionInput')
export class UpsertDatabaseConnectionInput {
  @Field(() => String)
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @Field(() => String)
  @IsString()
  @MaxLength(2048)
  baseUrl: string;

  // Omitted when editing an existing connection to keep the stored token
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  apiToken?: string;

  @Field(() => Boolean)
  @IsBoolean()
  isEnabled: boolean;
}

@ObjectType('DatabaseCentreConnectionVerification')
export class DatabaseConnectionVerificationDTO {
  @Field(() => String)
  status: string;

  @Field(() => String)
  message: string;

  @Field(() => Int)
  basesVisible: number;

  @Field(() => DatabaseConnectionDTO)
  connection: DatabaseConnectionDTO;
}

@ObjectType('DatabaseCentreAvailability')
export class DatabaseCentreAvailabilityDTO {
  @Field(() => Boolean)
  isConfigured: boolean;

  @Field(() => Boolean)
  isEnabled: boolean;
}
