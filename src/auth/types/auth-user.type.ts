import { UserType } from '../../users/entities/user.entity';

export type AuthUser = {
  sub: string;
  email: string;
  type: UserType;
  refreshToken?: string;
};
