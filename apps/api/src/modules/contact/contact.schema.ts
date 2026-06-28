import { z } from 'zod';

export const CreateContactSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  phone: z.string().max(40).optional(),
  company: z.string().max(200).optional(),
  subject: z.string().max(200).optional(),
  message: z.string().min(5).max(5000),
  source: z.string().max(64).optional(),
  recaptchaToken: z.string().max(2048).optional(),
});

export type CreateContactInput = z.infer<typeof CreateContactSchema>;
