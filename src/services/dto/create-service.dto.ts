import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({
    example: 'Corte de cabelo',
    description: 'Nome do serviço oferecido',
  })
  @IsString()
  NAME: string;

  @ApiProperty({
    minimum: 0,
    example: 35.0,
    description: 'Preço do serviço em reais',
  })
  @IsNumber()
  @Min(0)
  PRICE: number;

  @ApiProperty({ minimum: 1, example: 30, description: 'Duração em minutos' })
  @IsNumber()
  @Min(1)
  DURATION_MINUTES: number;
}
