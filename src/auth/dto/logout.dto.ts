import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class LogoutDto {
  @ApiProperty({ format: 'uuid', description: 'ID do usuário autenticado' })
  @IsUUID()
  id: string;
}
