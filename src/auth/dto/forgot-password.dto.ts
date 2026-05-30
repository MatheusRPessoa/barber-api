import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  EMAIL: string;
}
