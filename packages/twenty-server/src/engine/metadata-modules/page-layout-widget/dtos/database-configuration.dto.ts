import { Field, ObjectType } from '@nestjs/graphql';

import { IsIn, IsNotEmpty } from 'class-validator';
import { type DatabaseConfiguration } from 'twenty-shared/types';

import { WidgetConfigurationType } from 'src/engine/metadata-modules/page-layout-widget/enums/widget-configuration-type.type';

@ObjectType('DatabaseConfiguration')
export class DatabaseConfigurationDTO implements DatabaseConfiguration {
  @Field(() => WidgetConfigurationType)
  @IsIn([WidgetConfigurationType.DATABASE])
  @IsNotEmpty()
  configurationType: WidgetConfigurationType.DATABASE;
}
