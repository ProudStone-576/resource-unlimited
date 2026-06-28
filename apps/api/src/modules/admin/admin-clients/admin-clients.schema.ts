import { z } from 'zod';
import { CompanyApplicationStatus } from '@prisma/client';

export const ListCompaniesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  approved: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
});
export type ListCompaniesQuery = z.infer<typeof ListCompaniesQuerySchema>;

export const ApproveCompanySchema = z.object({
  notes: z.string().max(2000).optional(),
});
export type ApproveCompanyInput = z.infer<typeof ApproveCompanySchema>;

export const RejectCompanySchema = z.object({
  reason: z.string().min(1).max(2000),
});
export type RejectCompanyInput = z.infer<typeof RejectCompanySchema>;

export const ListApplicationsQuerySchema = z.object({
  status: z.nativeEnum(CompanyApplicationStatus).optional(),
});
export type ListApplicationsQuery = z.infer<typeof ListApplicationsQuerySchema>;

export const SetCompanyPriceListSchema = z.object({
  priceListId: z.string().min(1).nullable(),
});
export type SetCompanyPriceListInput = z.infer<typeof SetCompanyPriceListSchema>;
