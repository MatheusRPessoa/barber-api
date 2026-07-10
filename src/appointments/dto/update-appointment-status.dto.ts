import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import {
  AppointmentStatus,
  CancelReason,
} from '../enums/appointment-status.enum';

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

  @ApiPropertyOptional({
    enum: CancelReason,
    description:
      'Obrigatório quando STATUS = CANCELLED. Deve pertencer ao conjunto de motivos do papel de quem cancela.',
  })
  @IsOptional()
  @IsEnum(CancelReason)
  CANCEL_REASON?: CancelReason;

  @ApiPropertyOptional({
    maxLength: 300,
    description:
      'Texto livre (máx 300). Obrigatório quando CANCEL_REASON = OTHER.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  CANCEL_NOTE?: string;

    @ApiPropertyOptional({
    example: '0427',
    description:
      'Obrigatório quando STATUS = COMPLETED. PIN de 4 dígitos que o cliente informa ao barbeiro.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}$/, { message: 'COMPLETION_CODE must be 4 digits' })
  COMPLETION_CODE?: string;
}
