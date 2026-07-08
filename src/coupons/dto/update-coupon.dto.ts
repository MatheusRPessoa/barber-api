import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class UpdateCouponDto {
  @ApiPropertyOptional({ example: 'NEWUSER' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  CODE?: string;

  @ApiPropertyOptional({ example: 30, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  DISCOUNT_PERCENT?: number;

  @ApiPropertyOptional({
    example: '2026-07-20',
    description: 'Formato YYYY-MM-DD',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'VALID_UNTIL must be in format YYYY-MM-DD',
  })
  VALID_UNTIL?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  ACTIVE?: boolean;
}
