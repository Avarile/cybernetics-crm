// REST body for POST /apps/connections/get.
import { IsUUID } from 'class-validator';

export class GetAppConnectionDto {
  @IsUUID()
  id: string;
}
