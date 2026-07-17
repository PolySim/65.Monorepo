import type { Session, User } from 'better-auth';
import type { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: User;
  session: Session;
}
