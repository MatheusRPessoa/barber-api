import { IsString, IsUUID, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsUUID()
  USER_ID: string;

  @IsString()
  TOKEN: string;

  @IsString()
  @MinLength(6)
  NEW_PASSWORD: string;
}
