import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserType } from '../../users/entities/user.entity';

export class RegisterDto {
  @IsString()
  NAME: string;

  @IsEmail()
  EMAIL: string;

  @IsString()
  @MinLength(6)
  PASSWORD: string;

  @IsEnum(UserType)
  TYPE: UserType;

  @IsString()
  @IsOptional()
  SHOP_NAME?: string;
}
