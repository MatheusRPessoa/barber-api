import { IsString, IsUUID, Matches } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  BARBER_ID: string;

  @IsUUID()
  SERVICE_ID: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'DATE must be YYYY-MM-DD' })
  DATE: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'TIME must be HH:MM' })
  TIME: string;
}
