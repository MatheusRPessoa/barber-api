import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ format: 'email', example: 'joao@barbearia.com' })
  @IsEmail()
  EMAIL: string;

  @ApiProperty({ minLength: 6, example: 'senha123' })
  @IsString()
  PASSWORD: string;
}
