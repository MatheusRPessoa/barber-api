import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class UpdateClientDto {
  @ApiPropertyOptional({ example: 'João Silva' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  NAME?: string;

  @ApiPropertyOptional({
    example: '123.456.789-09',
    description: 'Formato XXX.XXX.XXX-XX ou 11 dígitos',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, {
    message: 'CPF must be in format XXX.XXX.XXX-XX or 11 digits',
  })
  CPF?: string;

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
}
