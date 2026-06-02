import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateServiceDto {
  @ApiPropertyOptional({ example: 'Corte de cabelo' })
  @IsOptional()
  @IsString()
  NAME?: string;

  @ApiPropertyOptional({ minimum: 0, example: 35.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  PRICE?: number;

  @ApiPropertyOptional({
    minimum: 1,
    example: 30,
    description: 'Duração em minutos',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  DURATION_MINUTES?: number;
}
