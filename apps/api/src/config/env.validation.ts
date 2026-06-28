import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  API_HOST: z.string().default('0.0.0.0'),
  API_CORS_ORIGINS: z.string().default('http://localhost:3000'),

  DATABASE_URL: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(8).default('dev-access-secret-change-me'),
  JWT_REFRESH_SECRET: z.string().min(8).default('dev-refresh-secret-change-me'),
  JWT_ACCESS_TTL: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL: z.coerce.number().int().positive().default(2_592_000),

  MAIL_HOST: z.string().optional(),
  MAIL_PORT: z.coerce.number().int().optional(),
  MAIL_USER: z.string().optional(),
  MAIL_PASS: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  SALES_INBOX: z.string().email().optional(),

  // Phase 2
  WEB_PUBLIC_URL: z.string().url().default('http://localhost:3000'),
  QUOTE_PDF_DIR: z.string().optional(),
  QUOTE_PDF_PUBLIC_BASE: z.string().default('/static/quotes'),
  ADMIN_API_TOKEN: z.string().min(16).optional(),
  RECAPTCHA_SECRET: z.string().optional(),
  RECAPTCHA_MIN_SCORE: z.coerce.number().min(0).max(1).default(0.5),
  THROTTLE_TTL: z.coerce.number().int().positive().default(60),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(20),
  QUOTE_THROTTLE_TTL: z.coerce.number().int().positive().default(3600),
  QUOTE_THROTTLE_LIMIT: z.coerce.number().int().positive().default(5),

  // Phase 3 — auth
  AUTH_COOKIE_DOMAIN: z.string().optional(),
  AUTH_COOKIE_SECURE: z.coerce.boolean().default(false),
  AUTH_COOKIE_NAME_ACCESS: z.string().default('ru_access'),
  AUTH_COOKIE_NAME_REFRESH: z.string().default('ru_refresh'),
  AUTH_MAX_FAILED_ATTEMPTS: z.coerce.number().int().positive().default(5),
  AUTH_LOCKOUT_MINUTES: z.coerce.number().int().positive().default(15),
  AUTH_PASSWORD_MIN_LENGTH: z.coerce.number().int().min(8).default(10),
  AUTH_EMAIL_VERIFY_TTL_MIN: z.coerce.number().int().positive().default(1440),
  AUTH_PASSWORD_RESET_TTL_MIN: z.coerce.number().int().positive().default(60),

  // Phase 4 — portal
  INVOICE_PDF_DIR: z.string().optional(),
  INVOICE_PDF_PUBLIC_BASE: z.string().default('/static/invoices'),

  // Phase 5 — uploads
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

export function envValidation(raw: Record<string, unknown>): AppEnv {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const formatted = parsed.error.flatten().fieldErrors;
    throw new Error('Invalid environment variables: ' + JSON.stringify(formatted, null, 2));
  }
  return parsed.data;
}
