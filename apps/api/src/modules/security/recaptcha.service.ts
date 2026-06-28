import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RecaptchaVerifyResult {
  ok: boolean;
  score?: number;
  action?: string;
  reason?: string;
}

@Injectable()
export class RecaptchaService {
  private readonly logger = new Logger(RecaptchaService.name);
  private readonly secret?: string;
  private readonly minScore: number;
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    this.secret = this.config.get<string>('RECAPTCHA_SECRET') || undefined;
    this.minScore = Number(this.config.get<string>('RECAPTCHA_MIN_SCORE') ?? '0.5');
    this.enabled = Boolean(this.secret);
    if (!this.enabled) {
      this.logger.warn('Recaptcha disabled (RECAPTCHA_SECRET not set).');
    }
  }

  async verify(token: string | undefined, expectedAction: string): Promise<RecaptchaVerifyResult> {
    if (!this.enabled) return { ok: true, reason: 'disabled' };
    if (!token) return { ok: false, reason: 'missing_token' };

    try {
      const body = new URLSearchParams({ secret: this.secret as string, response: token });
      const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body,
      });
      const data = (await res.json()) as {
        success: boolean;
        score?: number;
        action?: string;
        'error-codes'?: string[];
      };
      if (!data.success) {
        return { ok: false, reason: (data['error-codes'] ?? []).join(',') || 'unsuccessful' };
      }
      if (data.action && data.action !== expectedAction) {
        return { ok: false, reason: 'action_mismatch', score: data.score, action: data.action };
      }
      if (typeof data.score === 'number' && data.score < this.minScore) {
        return { ok: false, reason: 'score_too_low', score: data.score };
      }
      return { ok: true, score: data.score, action: data.action };
    } catch (err) {
      this.logger.warn(`Recaptcha verify failed: ${(err as Error).message}`);
      return { ok: false, reason: 'verify_failed' };
    }
  }
}
