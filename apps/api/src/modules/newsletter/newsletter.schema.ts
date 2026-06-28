import { z } from 'zod';
import { Locale } from '@prisma/client';

export const SubscribeSchema = z.object({
  email: z.string().email().max(200),
  name: z.string().max(200).optional(),
  companyName: z.string().max(200).optional(),
  locale: z.nativeEnum(Locale).default(Locale.EN),
  source: z.string().max(64).optional(),
  recaptchaToken: z.string().max(2048).optional(),
});
export type SubscribeInput = z.infer<typeof SubscribeSchema>;

export const UnsubscribeSchema = z.object({
  token: z.string().min(16).max(512),
});
export type UnsubscribeInput = z.infer<typeof UnsubscribeSchema>;
