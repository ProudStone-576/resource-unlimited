import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Ip,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';
import { CurrentUser, type AuthUser } from './current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import {
  ConfirmPasswordResetSchema,
  LoginSchema,
  RegisterSchema,
  RequestPasswordResetSchema,
  VerifyEmailSchema,
  type ConfirmPasswordResetInput,
  type LoginInput,
  type RegisterInput,
  type RequestPasswordResetInput,
  type VerifyEmailInput,
} from './auth.schema';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  private cookieOpts(maxAgeMs: number): {
    httpOnly: true;
    sameSite: 'lax';
    secure: boolean;
    path: string;
    maxAge: number;
    domain?: string;
  } {
    const domain = this.config.get<string>('AUTH_COOKIE_DOMAIN') || undefined;
    const opts: {
      httpOnly: true;
      sameSite: 'lax';
      secure: boolean;
      path: string;
      maxAge: number;
      domain?: string;
    } = {
      httpOnly: true,
      sameSite: 'lax',
      secure: Boolean(this.config.get<boolean>('AUTH_COOKIE_SECURE')),
      path: '/',
      maxAge: maxAgeMs,
    };
    if (domain) opts.domain = domain;
    return opts;
  }

  private setAuthCookies(
    res: Response,
    tokens: { access: string; refresh: string; refreshExpiresAt: Date },
  ) {
    const accessName = this.config.get<string>('AUTH_COOKIE_NAME_ACCESS') ?? 'ru_access';
    const refreshName = this.config.get<string>('AUTH_COOKIE_NAME_REFRESH') ?? 'ru_refresh';
    const accessTtlSec = Number(this.config.get('JWT_ACCESS_TTL') ?? 900);
    const refreshMaxAge = tokens.refreshExpiresAt.getTime() - Date.now();

    res.cookie(accessName, tokens.access, this.cookieOpts(accessTtlSec * 1000));
    res.cookie(refreshName, tokens.refresh, this.cookieOpts(refreshMaxAge));
  }

  private clearAuthCookies(res: Response) {
    const accessName = this.config.get<string>('AUTH_COOKIE_NAME_ACCESS') ?? 'ru_access';
    const refreshName = this.config.get<string>('AUTH_COOKIE_NAME_REFRESH') ?? 'ru_refresh';
    res.clearCookie(accessName, { path: '/' });
    res.clearCookie(refreshName, { path: '/' });
  }

  @Post('register')
  @Throttle({ quote: { ttl: 3_600_000, limit: 10 } })
  @UsePipes(new ZodValidationPipe(RegisterSchema))
  register(@Body() body: RegisterInput) {
    return this.auth.register(body);
  }

  @Post('login')
  @Throttle({ quote: { ttl: 60_000, limit: 10 } })
  @HttpCode(200)
  async login(
    @Body(new ZodValidationPipe(LoginSchema)) body: LoginInput,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(body, { ip, ua });
    this.setAuthCookies(res, result);
    return { access: result.access, user: result.user };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshName = this.config.get<string>('AUTH_COOKIE_NAME_REFRESH') ?? 'ru_refresh';
    const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
    const raw = cookies?.[refreshName] ?? (req.body?.refresh as string | undefined);
    if (!raw) return { error: 'Missing refresh token' };
    const result = await this.auth.refresh(raw, { ip, ua });
    this.setAuthCookies(res, result);
    return { access: result.access, user: result.user };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshName = this.config.get<string>('AUTH_COOKIE_NAME_REFRESH') ?? 'ru_refresh';
    const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
    const raw = cookies?.[refreshName];
    await this.auth.logout(raw);
    this.clearAuthCookies(res);
    return { ok: true };
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async logoutAll(@CurrentUser() user: AuthUser, @Res({ passthrough: true }) res: Response) {
    await this.auth.logoutAll(user.id);
    this.clearAuthCookies(res);
    return { ok: true };
  }

  @Post('verify-email')
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(VerifyEmailSchema))
  verifyEmail(@Body() body: VerifyEmailInput) {
    return this.auth.verifyEmail(body);
  }

  @Post('password-reset/request')
  @Throttle({ quote: { ttl: 3_600_000, limit: 5 } })
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(RequestPasswordResetSchema))
  requestPasswordReset(@Body() body: RequestPasswordResetInput) {
    return this.auth.requestPasswordReset(body);
  }

  @Post('password-reset/confirm')
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(ConfirmPasswordResetSchema))
  confirmPasswordReset(@Body() body: ConfirmPasswordResetInput) {
    return this.auth.confirmPasswordReset(body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }
}
