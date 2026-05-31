import { IsUUID } from 'class-validator';

export class LogoutDto {
  @IsUUID()
  id: string;
}
