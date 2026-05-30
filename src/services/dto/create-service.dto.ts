import { IsNumber, IsString, Min } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  NAME: string;

  @IsNumber()
  @Min(0)
  PRICE: number;

  @IsNumber()
  @Min(1)
  DURATION_MINUTES: number;
}
