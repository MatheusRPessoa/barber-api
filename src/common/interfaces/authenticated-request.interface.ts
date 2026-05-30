import { Request } from 'express';
import { UserType } from '../../users/entities/user.entity';

export interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
    type: UserType;
    refreshToken?: string;
  };
}
