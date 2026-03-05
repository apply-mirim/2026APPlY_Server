import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AdminJwtPayload } from './interfaces/admin-jwt-payload.interface';

@Injectable()
export class AuthService {
  private refreshTokenHash: string | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  private getAccessSecret(): string {
    return this.configService.get<string>(
      'ADMIN_ACCESS_SECRET',
      'apply-access',
    );
  }

  private getRefreshSecret(): string {
    return this.configService.get<string>(
      'ADMIN_REFRESH_SECRET',
      'apply-refresh',
    );
  }

  private getAdminUsername(): string {
    return this.configService.get<string>('ADMIN_USERNAME', 'admin');
  }

  private getAdminPassword(): string {
    return this.configService.get<string>('ADMIN_PASSWORD', 'admin1234');
  }

  private async validatePassword(rawPassword: string): Promise<boolean> {
    const expectedPassword = this.getAdminPassword();

    if (expectedPassword.startsWith('$2')) {
      return bcrypt.compare(rawPassword, expectedPassword);
    }

    return rawPassword === expectedPassword;
  }

  private async signToken(
    payload: AdminJwtPayload,
    secret: string,
    expiresIn: string | number,
  ): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn: expiresIn as never,
    });
  }

  async login(username: string, password: string) {
    if (username !== this.getAdminUsername()) {
      throw new UnauthorizedException('어드민 계정 정보가 올바르지 않습니다.');
    }

    const isValid = await this.validatePassword(password);
    if (!isValid) {
      throw new UnauthorizedException('어드민 계정 정보가 올바르지 않습니다.');
    }

    const accessToken = await this.signToken(
      {
        sub: 'admin',
        username,
        type: 'access',
      },
      this.getAccessSecret(),
      this.configService.get<string>('ADMIN_ACCESS_EXPIRES', '15m'),
    );

    const refreshToken = await this.signToken(
      {
        sub: 'admin',
        username,
        type: 'refresh',
      },
      this.getRefreshSecret(),
      this.configService.get<string>('ADMIN_REFRESH_EXPIRES', '7d'),
    );

    this.refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    return {
      username,
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken || !this.refreshTokenHash) {
      throw new UnauthorizedException('다시 로그인해 주세요.');
    }

    const isTokenMatched = await bcrypt.compare(
      refreshToken,
      this.refreshTokenHash,
    );
    if (!isTokenMatched) {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
    }

    let payload: AdminJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<AdminJwtPayload>(
        refreshToken,
        {
          secret: this.getRefreshSecret(),
        },
      );
    } catch {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
    }

    if (payload.sub !== 'admin' || payload.type !== 'refresh') {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
    }

    const accessToken = await this.signToken(
      {
        sub: 'admin',
        username: payload.username,
        type: 'access',
      },
      this.getAccessSecret(),
      this.configService.get<string>('ADMIN_ACCESS_EXPIRES', '15m'),
    );

    const nextRefreshToken = await this.signToken(
      {
        sub: 'admin',
        username: payload.username,
        type: 'refresh',
      },
      this.getRefreshSecret(),
      this.configService.get<string>('ADMIN_REFRESH_EXPIRES', '7d'),
    );

    this.refreshTokenHash = await bcrypt.hash(nextRefreshToken, 10);

    return {
      username: payload.username,
      accessToken,
      refreshToken: nextRefreshToken,
    };
  }

  async verifyAccessToken(token: string): Promise<AdminJwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<AdminJwtPayload>(
        token,
        {
          secret: this.getAccessSecret(),
        },
      );

      if (payload.sub !== 'admin' || payload.type !== 'access') {
        throw new UnauthorizedException('접근 권한이 없습니다.');
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('접근 권한이 없습니다.');
    }
  }

  clearRefreshToken() {
    this.refreshTokenHash = null;
  }

  getCookieOptions(maxAgeMs: number) {
    const isProduction =
      this.configService.get<string>('NODE_ENV', 'development') ===
      'production';

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      maxAge: maxAgeMs,
      path: '/',
    };
  }

  getAccessMaxAgeMs() {
    const minutes = Number(
      this.configService.get<string>('ADMIN_ACCESS_COOKIE_MIN', '15'),
    );
    if (Number.isNaN(minutes)) {
      throw new InternalServerErrorException(
        'ADMIN_ACCESS_COOKIE_MIN 설정이 올바르지 않습니다.',
      );
    }
    return minutes * 60 * 1000;
  }

  getRefreshMaxAgeMs() {
    const days = Number(
      this.configService.get<string>('ADMIN_REFRESH_COOKIE_DAY', '7'),
    );
    if (Number.isNaN(days)) {
      throw new InternalServerErrorException(
        'ADMIN_REFRESH_COOKIE_DAY 설정이 올바르지 않습니다.',
      );
    }
    return days * 24 * 60 * 60 * 1000;
  }
}
