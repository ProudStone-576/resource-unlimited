import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
  firstName: z.string().min(1).max(120),
  lastName: z.string().min(1).max(120),
  companyName: z.string().max(200).optional(),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RequestPasswordResetSchema = z.object({
  email: z.string().email().max(200),
});
export type RequestPasswordResetInput = z.infer<typeof RequestPasswordResetSchema>;

export const ConfirmPasswordResetSchema = z.object({
  token: z.string().min(16).max(512),
  password: z.string().min(8).max(200),
});
export type ConfirmPasswordResetInput = z.infer<typeof ConfirmPasswordResetSchema>;

export const VerifyEmailSchema = z.object({
  token: z.string().min(16).max(512),
});
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;
