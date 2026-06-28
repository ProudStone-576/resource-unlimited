import { z } from 'zod';
import { AddressType } from '@prisma/client';

export const AddressInputSchema = z.object({
  type: z.nativeEnum(AddressType).default(AddressType.SHIPPING),
  label: z.string().max(80).optional(),
  attentionTo: z.string().max(120).optional(),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(80),
  province: z.string().min(1).max(80),
  postalCode: z.string().min(1).max(20),
  country: z.string().min(2).max(2).default('CA'),
  phone: z.string().max(40).optional(),
  isDefault: z.boolean().default(false),
});
export type AddressInput = z.infer<typeof AddressInputSchema>;
