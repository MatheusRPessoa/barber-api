import { IsEmail, IsEnum, IsNotEmpty, IsString, Matches, MinLength, ValidateIf } from 'class-validator';
import { UserType } from '../../users/entities/user.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ 
    example: 'João Silva' 
  })
  @IsString()
  NAME: string;

  @ApiProperty({ 
    format: 'email', 
    example: 'joao@email.com' 
  })
  @IsEmail()
  EMAIL: string;

  @ApiProperty({ 
    minLength: 6, 
    example: 'senha123' 
  })
  @IsString()
  @MinLength(6)
  PASSWORD: string;

  @ApiProperty({ 
    enum: UserType, 
    enumName: 'UserType', 
    example: UserType.CLIENT 
  })
  @IsEnum(UserType)
  TYPE: UserType;

  @ApiPropertyOptional({ 
    example: 'Barbearia do João', 
    description: 'Obrigatório para TYPE=BARBER' 
  })
  @ValidateIf((o) => o.TYPE === UserType.BARBER)
  @IsString()
  @IsNotEmpty({ message: 'SHOP_NAME is required for barbers' })
  SHOP_NAME?: string;
  
  @ApiPropertyOptional({ 
    example: '12.345.678/0001-90', 
    description: 'Formato XX.XXX.XXX/XXXX-XX ou 14 dígitos. Obrigatório para TYPE=BARBER' 
  })
  @ValidateIf((o) => o.TYPE === UserType.BARBER)
  @IsString()
  @IsNotEmpty({ message: 'CNPJ is required for barbers' })
  @Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/, {
    message: 'CNPJ must be in format XX.XXX.XXX/XXXX-XX or 14 digits',
  })
  CNPJ?: string;

  @ApiPropertyOptional({ example: 'Rua das Flores' })
  @ValidateIf((o) => o.TYPE === UserType.BARBER)
  @IsString()
  @IsNotEmpty()
  STREET?: string;

  @ApiPropertyOptional({ example: '123' })
  @ValidateIf((o) => o.TYPE === UserType.BARBER)
  @IsString()
  @IsNotEmpty()
  NUMBER?: string;

  @ApiPropertyOptional({ example: 'Sala 2' })
  @ValidateIf((o) => o.TYPE === UserType.BARBER)
  @IsString()
  COMPLEMENT?: string;

  @ApiPropertyOptional({ example: 'Centro' })
  @ValidateIf((o) => o.TYPE === UserType.BARBER)
  @IsString()
  @IsNotEmpty()
  NEIGHBORHOOD?: string;

  @ApiPropertyOptional({ example: 'São Paulo' })
  @ValidateIf((o) => o.TYPE === UserType.BARBER)
  @IsString()
  @IsNotEmpty()
  CITY?: string;

  @ApiPropertyOptional({ example: 'SP', description: '2 letras maiúsculas' })
  @ValidateIf((o) => o.TYPE === UserType.BARBER)
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{2}$/, { message: 'STATE must be a 2-letter uppercase code (e.g. SP)' })
  STATE?: string;

  @ApiPropertyOptional({ example: '01310-100', description: 'Formato 00000-000' })
  @ValidateIf((o) => o.TYPE === UserType.BARBER)
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{5}-\d{3}$/, { message: 'ZIP_CODE must be in format 00000-000' })
  ZIP_CODE?: string;
}
