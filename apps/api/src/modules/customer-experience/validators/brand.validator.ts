import { z } from 'zod';

export const CreateBrandSchema = z.object({
  name: z.string({ required_error: 'Brand name is required' }).min(2).max(100).trim(),
  slug: z.string({ required_error: 'Slug is required' }).min(2).max(100).toLowerCase().trim(),
  logoUrl: z.string().url().optional().nullable(),
  countryOfOrigin: z.string().max(60).trim().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const UpdateBrandSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  slug: z.string().min(2).max(100).toLowerCase().trim().optional(),
  logoUrl: z.string().url().optional().nullable(),
  countryOfOrigin: z.string().max(60).trim().optional().nullable(),
  isActive: z.boolean().optional(),
});
