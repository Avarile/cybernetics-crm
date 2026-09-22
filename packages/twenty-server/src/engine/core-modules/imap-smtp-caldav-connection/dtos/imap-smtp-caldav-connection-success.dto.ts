// GraphQL response DTO returned after saving an IMAP/SMTP/CALDAV account.
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('ImapSmtpCaldavConnectionSuccess')
export class ImapSmtpCaldavConnectionSuccessDTO {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => String)
  connectedAccountId: string;
}
