import { z } from 'zod';
import { WebhookEvent } from '@prisma/client';

export const WebhookEndpointInputSchema = z.object({
  name: z.string().min(1).max(200),
  url: z.string().url().max(2000),
  secret: z.string().min(16).max(200),
  events: z.array(z.nativeEnum(WebhookEvent)).min(1),
  isActive: z.boolean().default(true),
});
export type WebhookEndpointInput = z.infer<typeof WebhookEndpointInputSchema>;
