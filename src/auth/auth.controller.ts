import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { SuccessMessage } from '../common/decorators/success-message.decorator';
import { AdminLoginDto } from './dtos/admin-login.dto';
import { AuthService } from './auth.service';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from './auth.constants';

@ApiTags('admin-auth')
@Controller('admin/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private extractRefreshToken(request: Request): string {
    const rawCookies: unknown = (request as Request & { cookies?: unknown })
      .cookies;

    if (
      rawCookies &&
      typeof rawCookies === 'object' &&
      !Array.isArray(rawCookies)
    ) {
      const cookieValue = (rawCookies as Record<string, unknown>)[
        REFRESH_TOKEN_COOKIE
      ];
      if (typeof cookieValue === 'string' && cookieValue.trim().length > 0) {
        return cookieValue;
      }
    }

    return '';
  }

  @Post('login')
  @ApiOperation({ summary: '어드민 로그인' })
  @ApiBody({ type: AdminLoginDto })
  @ApiResponse({
    status: 201,
    description: '로그인 성공(Access/Refresh 토큰이 HttpOnly 쿠키로 설정됨)',
  })
  @SuccessMessage('어드민 로그인이 완료되었습니다.')
  async login(
    @Body() dto: AdminLoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(dto.username, dto.password);

    response.cookie(
      ACCESS_TOKEN_COOKIE,
      result.accessToken,
      this.authService.getCookieOptions(this.authService.getAccessMaxAgeMs()),
    );

    response.cookie(
      REFRESH_TOKEN_COOKIE,
      result.refreshToken,
      this.authService.getCookieOptions(this.authService.getRefreshMaxAgeMs()),
    );

    return {
      username: result.username,
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: '어드민 토큰 갱신' })
  @ApiResponse({
    status: 201,
    description: '리프레시 쿠키 기반 토큰 재발급',
  })
  @SuccessMessage('어드민 토큰이 갱신되었습니다.')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = this.extractRefreshToken(request);
    const result = await this.authService.refresh(refreshToken);

    response.cookie(
      ACCESS_TOKEN_COOKIE,
      result.accessToken,
      this.authService.getCookieOptions(this.authService.getAccessMaxAgeMs()),
    );

    response.cookie(
      REFRESH_TOKEN_COOKIE,
      result.refreshToken,
      this.authService.getCookieOptions(this.authService.getRefreshMaxAgeMs()),
    );

    return {
      username: result.username,
    };
  }

  @Post('logout')
  @ApiOperation({ summary: '어드민 로그아웃' })
  @ApiResponse({ status: 201, description: '로그아웃 성공(쿠키 삭제)' })
  @SuccessMessage('어드민 로그아웃이 완료되었습니다.')
  logout(@Res({ passthrough: true }) response: Response) {
    this.authService.clearRefreshToken();

    response.clearCookie(ACCESS_TOKEN_COOKIE, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
    });
    response.clearCookie(REFRESH_TOKEN_COOKIE, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
    });

    return {
      ok: true,
    };
  }
}
