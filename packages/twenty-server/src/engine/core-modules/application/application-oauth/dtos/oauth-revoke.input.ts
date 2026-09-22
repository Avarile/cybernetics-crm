// REST body for the OAuth token revocation endpoint (RFC 7009).
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class OAuthRevokeInput {
  @IsString()
  @MaxLength(4096)
  token: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  token_type_hint?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  client_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  client_secret?: string;
}
