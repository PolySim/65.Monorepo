import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserRepository } from '../repository/user.repository';
import { AuthenticatedRequest } from '../types/authenticated-request';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly userRepository: UserRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authUserId = request.user?.id;

    if (!authUserId) {
      throw new ForbiddenException('Administrator access required');
    }

    const user = await this.userRepository.findByAuthUserId(authUserId);
    if (!user || user.roleId !== 1) {
      throw new ForbiddenException('Administrator access required');
    }

    return true;
  }
}
