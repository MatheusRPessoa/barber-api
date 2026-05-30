import { ApiProperty } from '@nestjs/swagger';

export class BaseSuccessResponseDto {
  @ApiProperty({ example: true })
  succeeded: boolean;
}

export class SuccessMessageResponseDto extends BaseSuccessResponseDto {
  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;
}
