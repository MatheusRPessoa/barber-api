import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  RATING: number;

  @ApiPropertyOptional({ example: 'Ótimo atendimento!' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  COMMENT?: string;
}
