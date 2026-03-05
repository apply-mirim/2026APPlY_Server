import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { ACCESS_TOKEN_COOKIE } from '../auth.constants';

@Injectable()
export class AdminJwtGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  private extractToken(request: Request): string | null {
    const rawCookies: unknown = (request as Request & { cookies?: unknown })
      .cookies;

    if (
      rawCookies &&
      typeof rawCookies === 'object' &&
      !Array.isArray(rawCookies)
    ) {
      const cookieValue = (rawCookies as Record<string, unknown>)[
        ACCESS_TOKEN_COOKIE
      ];

      if (typeof cookieValue === 'string' && cookieValue.trim().length > 0) {
        return cookieValue;
      }
    }

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    return authHeader.slice('Bearer '.length).trim();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { admin?: { username: string } }>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('로그인이 필요합니다.');
    }

    const payload = await this.authService.verifyAccessToken(token);
    request.admin = {
      username: payload.username,
    };

    return true;
  }
}
