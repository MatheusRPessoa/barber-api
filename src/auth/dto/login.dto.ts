import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  EMAIL: string;

  @IsString()
  PASSWORD: string;
}
