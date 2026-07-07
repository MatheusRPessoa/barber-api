import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateCouponDto {
  @ApiProperty({ example: 'NEWUSER' })
  @IsString()
  @IsNotEmpty()
  CODE: string;

  @ApiProperty({ example: 30, minimum: 1, maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  DISCOUNT_PERCENT: number;

  @ApiProperty({ example: '2026-07-20', description: 'Formato YYYY-MM-DD' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'VALID_UNTIL must be in format YYYY-MM-DD',
  })
  VALID_UNTIL: string;
}
