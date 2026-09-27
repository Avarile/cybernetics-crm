import { Field, InputType } from '@nestjs/graphql';

import {
  ArrayMaxSize,
  ArrayMinSize,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { DATABASE_CENTRE_MAX_ATTACHMENTS_PER_RECORD } from 'src/modules/database-record/constants/database-centre.constants';

@InputType('AttachDatabaseCentreRecordsInput')
export class AttachDatabaseRecordsInput {
  @Field(() => String)
  @IsString()
  @MaxLength(255)
  targetObjectNameSingular: string;

  @Field(() => UUIDScalarType)
  @IsUUID()
  targetRecordId: string;

  @Field(() => String)
  @IsString()
  @MaxLength(255)
  baseId: string;

  @Field(() => String)
  @IsString()
  @MaxLength(255)
  tableId: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  viewId?: string;

  @Field(() => [String])
  @ArrayMinSize(1)
  @ArrayMaxSize(DATABASE_CENTRE_MAX_ATTACHMENTS_PER_RECORD)
  @IsString({ each: true })
  @MaxLength(255, { each: true })
  recordIds: string[];
}
