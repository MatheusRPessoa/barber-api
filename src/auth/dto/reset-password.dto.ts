import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ 
    format: 'uuid', 
    description: 'ID do usuário recebido na URL de reset' 
  })
  @IsUUID()
  USER_ID: string;

  @ApiProperty({ description: 'Token recebido por e-mail' })
  @IsString()
  TOKEN: string;

  @ApiProperty({ minLength: 6, example: 'nova_senha123' })
  @IsString()
  @MinLength(6)
  NEW_PASSWORD: string;
}
