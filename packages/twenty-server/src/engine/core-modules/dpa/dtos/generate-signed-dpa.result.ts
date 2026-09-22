import { Field, ObjectType } from '@nestjs/graphql';

import { DpaAgreementEntity } from 'src/engine/core-modules/dpa/entities/dpa-agreement.entity';

// The newly created DPA agreement record plus a URL to download its signed PDF
@ObjectType('GenerateSignedDpaResult')
export class GenerateSignedDpaResult {
  @Field(() => DpaAgreementEntity)
  agreement: DpaAgreementEntity;

  @Field()
  downloadUrl: string;
}
