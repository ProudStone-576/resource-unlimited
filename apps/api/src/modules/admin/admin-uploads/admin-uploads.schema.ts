import { z } from 'zod';

export const SignCloudinarySchema = z.object({
  folder: z.string().max(200).default('resources-unlimited/products'),
  publicId: z.string().max(200).optional(),
});
export type SignCloudinaryInput = z.infer<typeof SignCloudinarySchema>;

export const SignS3PutSchema = z.object({
  key: z.string().min(1).max(500),
  contentType: z.string().max(200),
  bucket: z.string().max(200).optional(),
  expiresInSec: z.number().int().positive().max(3600).default(900),
});
export type SignS3PutInput = z.infer<typeof SignS3PutSchema>;
