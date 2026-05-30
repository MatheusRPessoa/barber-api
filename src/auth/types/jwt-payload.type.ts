import { UserType } from '../../users/entities/user.entity';

export type JwtPayload = {
  sub: string;
  email: string;
  type: UserType;
};
