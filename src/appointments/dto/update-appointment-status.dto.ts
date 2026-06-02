import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { AppointmentStatus } from '../entities/appointment.entity';

export class UpdateAppointmentStatusDto {
  @ApiProperty({
    enum: [
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.COMPLETED,
      AppointmentStatus.CANCELLED,
    ],
    example: AppointmentStatus.CONFIRMED,
    description: 'Novo status do agendamento',
  })
  @IsIn([
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED,
  ])
  STATUS:
    | AppointmentStatus.CONFIRMED
    | AppointmentStatus.COMPLETED
    | AppointmentStatus.CANCELLED;
}
