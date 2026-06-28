import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import argon2 from 'argon2';

@Injectable()
export class PasswordService {
  private readonly minLength: number;

  constructor(private readonly config: ConfigService) {
    this.minLength = Number(this.config.get('AUTH_PASSWORD_MIN_LENGTH') ?? 10);
  }

  /** Returns null if valid, otherwise a human-readable reason. */
  validateStrength(password: string): string | null {
    if (password.length < this.minLength) {
      return `Password must be at least ${this.minLength} characters.`;
    }
    let classes = 0;
    if (/[a-z]/.test(password)) classes++;
    if (/[A-Z]/.test(password)) classes++;
    if (/[0-9]/.test(password)) classes++;
    if (/[^a-zA-Z0-9]/.test(password)) classes++;
    if (classes < 3) {
      return 'Password must contain at least 3 of: lowercase, uppercase, digits, symbols.';
    }
    return null;
  }

  hash(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19 * 1024, // 19 MB
      timeCost: 2,
      parallelism: 1,
    });
  }

  verify(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password).catch(() => false);
  }
}
