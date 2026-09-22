import { Field, ObjectType, OmitType } from '@nestjs/graphql';

import { IsOptional } from 'class-validator';

import { EmailConnectionSecurity } from 'src/engine/core-modules/imap-smtp-caldav-connection/enums/email-connection-security.enum';
import { ConnectedAccountDTO } from 'src/engine/metadata-modules/connected-account/dtos/connected-account.dto';

// Redacted connection parameters for a single IMAP/SMTP/CALDAV protocol,
// safe to expose to the client (no password/secret fields).
@ObjectType('PublicConnectionParametersOutput')
class PublicConnectionParametersDTO {
  @Field(() => String)
  host: string;

  @Field(() => Number)
  port: number;

  @Field(() => String, { nullable: true })
  username?: string;

  @Field(() => EmailConnectionSecurity, { nullable: true })
  connectionSecurity?: EmailConnectionSecurity;
}

// Redacted connection parameters grouped by protocol (IMAP/SMTP/CalDAV).
@ObjectType('PublicImapSmtpCaldavConnectionParameters')
class PublicImapSmtpCaldavConnectionParametersDTO {
  @Field(() => PublicConnectionParametersDTO, { nullable: true })
  IMAP?: PublicConnectionParametersDTO;

  @Field(() => PublicConnectionParametersDTO, { nullable: true })
  SMTP?: PublicConnectionParametersDTO;

  @Field(() => PublicConnectionParametersDTO, { nullable: true })
  CALDAV?: PublicConnectionParametersDTO;
}

// Client-safe variant of ConnectedAccountDTO with connectionParameters
// replaced by its redacted (password-free) form.
@ObjectType('ConnectedAccountPublicDTO')
export class ConnectedAccountPublicDTO extends OmitType(ConnectedAccountDTO, [
  'connectionParameters',
] as const) {
  @IsOptional()
  @Field(() => PublicImapSmtpCaldavConnectionParametersDTO, { nullable: true })
  connectionParameters: PublicImapSmtpCaldavConnectionParametersDTO | null;
}
