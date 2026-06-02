import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsString, IsUUID, Matches } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({
    format: 'uuid',
    description: 'ID da barbearia',
    example: 'a3bb189e-8bf9-3888-9912-ace4e6543002',
  })
  @IsUUID()
  BARBER_ID: string;

  @ApiProperty({
    type: [String],
    description: 'IDs dos serviços desejados (mínimo 1)',
    example: ['b4cc290f-9cf0-4999-0023-bdf5f7654113', 'c5dd391g-0dh1-5000-1134-ceg6g8765224'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  SERVICE_IDS: string[];

  @ApiProperty({
    example: '2026-06-15',
    description: 'Data no formato YYYY-MM-DD',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'DATE must be YYYY-MM-DD' })
  DATE: string;

  @ApiProperty({ example: '09:30', description: 'Horário no formato HH:MM' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'TIME must be HH:MM' })
  TIME: string;
}
