import { IsIn } from 'class-validator';
import { AppointmentStatus } from '../entities/appointment.entity';

export class UpdateAppointmentStatusDto {
  @IsIn([AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED] as const)
  STATUS: AppointmentStatus.COMPLETED | AppointmentStatus.CANCELLED;
}
