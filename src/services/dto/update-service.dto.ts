import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  NAME?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  PRICE?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  DURATION_MINUTES?: number;
}
