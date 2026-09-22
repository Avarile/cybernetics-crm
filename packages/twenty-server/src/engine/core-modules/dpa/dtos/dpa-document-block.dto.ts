import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';

import { DpaDocumentBlockKind } from 'src/engine/core-modules/dpa/enums/dpa-document-block-kind.enum';

registerEnumType(DpaDocumentBlockKind, { name: 'DpaDocumentBlockKind' });

// A single rendered block (heading, paragraph, or merge-field value) of a DPA document
@ObjectType('DpaDocumentBlock')
export class DpaDocumentBlockDTO {
  @Field(() => DpaDocumentBlockKind)
  kind: DpaDocumentBlockKind;

  @Field()
  text: string;

  @Field({ nullable: true })
  label?: string;

  @Field({ nullable: true })
  value?: string;
}
