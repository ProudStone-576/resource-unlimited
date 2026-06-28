import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import type { AccessTokenPayload } from './tokens.service';

function fromCookie(req: Request): string | null {
  const name = process.env.AUTH_COOKIE_NAME_ACCESS ?? 'ru_access';
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
  return cookies?.[name] ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        fromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET') as string,
    });
  }

  validate(payload: AccessTokenPayload) {
    if (!payload?.sub) throw new UnauthorizedException();
    return { id: payload.sub, role: payload.role, email: payload.email };
  }
}
