import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import GraphQLJSON from 'graphql-type-json';

import { DATABASE_CENTRE_MAX_RECORDS_PAGE_SIZE } from 'src/modules/database-record/constants/database-centre.constants';

@ObjectType('DatabaseCentreBase')
export class DatabaseCentreBaseDTO {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  icon: string | null;
}

@ObjectType('DatabaseCentreSpace')
export class DatabaseCentreSpaceDTO {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => [DatabaseCentreBaseDTO])
  bases: DatabaseCentreBaseDTO[];
}

@ObjectType('DatabaseCentreTable')
export class DatabaseCentreTableDTO {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  icon: string | null;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => String, { nullable: true })
  defaultViewId: string | null;
}

@ObjectType('DatabaseCentreField')
export class DatabaseCentreFieldDTO {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  type: string;

  @Field(() => Boolean)
  isPrimary: boolean;

  @Field(() => Boolean)
  isLookup: boolean;

  @Field(() => Boolean)
  isMultipleCellValue: boolean;

  @Field(() => String, { nullable: true })
  cellValueType: string | null;
}

@ObjectType('DatabaseCentreView')
export class DatabaseCentreViewDTO {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  type: string | null;
}

@ObjectType('DatabaseCentreTableSchema')
export class DatabaseCentreTableSchemaDTO {
  @Field(() => [DatabaseCentreFieldDTO])
  fields: DatabaseCentreFieldDTO[];

  @Field(() => [DatabaseCentreViewDTO])
  views: DatabaseCentreViewDTO[];
}

@ObjectType('DatabaseCentreRecord')
export class DatabaseCentreRecordDTO {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  // Cell values keyed by field id
  @Field(() => GraphQLJSON)
  fields: Record<string, unknown>;

  @Field(() => String, { nullable: true })
  createdTime: string | null;

  @Field(() => String, { nullable: true })
  lastModifiedTime: string | null;
}

@ObjectType('DatabaseCentreRecordPage')
export class DatabaseCentreRecordPageDTO {
  @Field(() => [DatabaseCentreRecordDTO])
  records: DatabaseCentreRecordDTO[];

  @Field(() => Int)
  take: number;

  @Field(() => Int)
  skip: number;

  @Field(() => Int, { nullable: true })
  totalCount: number | null;
}

@ObjectType('DatabaseCentreRecordDetail')
export class DatabaseCentreRecordDetailDTO {
  @Field(() => DatabaseCentreRecordDTO)
  record: DatabaseCentreRecordDTO;

  @Field(() => [DatabaseCentreFieldDTO])
  fields: DatabaseCentreFieldDTO[];

  @Field(() => String)
  deepLink: string;
}

@InputType('DatabaseCentreRecordOrderByInput')
export class DatabaseCentreRecordOrderByInput {
  @Field(() => String)
  @IsString()
  @MaxLength(255)
  fieldId: string;

  @Field(() => String)
  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc';
}

@InputType('DatabaseCentreRecordsQueryInput')
export class DatabaseCentreRecordsQueryInput {
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

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  searchFieldId?: string;

  @Field(() => [DatabaseCentreRecordOrderByInput], { nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DatabaseCentreRecordOrderByInput)
  orderBy?: DatabaseCentreRecordOrderByInput[];

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(DATABASE_CENTRE_MAX_RECORDS_PAGE_SIZE)
  take: number;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  skip: number;
}
