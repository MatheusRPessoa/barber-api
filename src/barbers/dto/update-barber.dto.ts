import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class UpdateBarberDto {
  @ApiPropertyOptional({ example: 'João Silva' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  NAME?: string;

  @ApiPropertyOptional({ example: 'Barbearia do João' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  SHOP_NAME?: string;

  @ApiPropertyOptional({ example: 'Rua das Flores' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  STREET?: string;

  @ApiPropertyOptional({ example: '123' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  NUMBER?: string;

  @ApiPropertyOptional({ example: 'Sala 2', required: false })
  @IsOptional()
  @IsString()
  COMPLEMENT?: string;

  @ApiPropertyOptional({ example: 'Centro' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  NEIGHBORHOOD?: string;

  @ApiPropertyOptional({ example: 'São Paulo' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  CITY?: string;

  @ApiPropertyOptional({
    example: 'SP',
    description: '2 letras maiúsculas',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}$/, {
    message: 'STATE must be a 2-letter uppercase code (e.g. SP)',
  })
  STATE?: string;

  @ApiPropertyOptional({
    example: '01310-100',
    description: 'Formato 00000-000',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{5}-\d{3}$/, {
    message: 'ZIP_CODE must be in format 00000-000',
  })
  ZIP_CODE?: string;

  @ApiPropertyOptional({ example: -23.55 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  LATITUDE?: number;

  @ApiPropertyOptional({ example: -46.63 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  LONGITUDE?: number;
}
