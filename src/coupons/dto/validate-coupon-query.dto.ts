import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class ValidateCouponQueryDto {
  @ApiProperty({ example: 'PROMO10' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  barberId: string;
}
