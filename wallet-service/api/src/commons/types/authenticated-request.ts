import { Request } from 'express';
import { UserEntity } from '../../api/user/user.entity';

export interface AuthenticatedRequest extends Request {
  user: UserEntity;
}
