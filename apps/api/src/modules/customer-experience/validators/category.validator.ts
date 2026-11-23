import { z } from 'zod';

export const CreateCategorySchema = z.object({
  name: z.string({ required_error: 'Category name is required' }).min(2).max(100).trim(),
  slug: z.string({ required_error: 'Slug is required' }).min(2).max(100).toLowerCase().trim(),
  parentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid parent category ID').optional().nullable(),
  description: z.string().max(500).trim().optional().nullable(),
  iconUrl: z.string().url().optional().nullable(),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const UpdateCategorySchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  slug: z.string().min(2).max(100).toLowerCase().trim().optional(),
  parentId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
  description: z.string().max(500).trim().optional().nullable(),
  iconUrl: z.string().url().optional().nullable(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});
