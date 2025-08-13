/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { verifyToken } from '@clerk/clerk-sdk-node';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { config } from 'src/config/config';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader: string = req.headers.authorization as string;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token manquant');
    }

    const token: string = authHeader.split(' ')[1];

    try {
      const payload = await verifyToken(token, {
        secretKey: config.CLERK_SECRET_KEY,
      });
      req.user = payload;
      return true;
    } catch (err) {
      console.error(err);
      throw new UnauthorizedException('Token invalide');
    }
  }
}
