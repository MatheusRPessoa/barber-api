import { IsIn } from 'class-validator';
import { AppointmentStatus } from '../entities/appointment.entity';

export class UpdateAppointmentStatusDto {
  @IsIn([AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED])
  STATUS: AppointmentStatus.CONFIRMED | AppointmentStatus.COMPLETED | AppointmentStatus.CANCELLED;
}
