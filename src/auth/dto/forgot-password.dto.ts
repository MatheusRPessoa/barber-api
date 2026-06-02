import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ format: 'email', example: 'joao@email.com' })
  @IsEmail()
  EMAIL: string;
}
