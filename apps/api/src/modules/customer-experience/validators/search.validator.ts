import { z } from 'zod';

export const SearchProductsQuerySchema = z.object({
  q: z.string().trim().optional(),
  categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID').optional(),
  brandId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid brand ID').optional(),
  sellerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid seller ID').optional(),
  make: z.string().toUpperCase().trim().optional(),
  model: z.string().toUpperCase().trim().optional(),
  year: z.coerce.number().int().min(1960).max(2035).optional(),
  minPriceInCents: z.coerce.number().int().min(0).optional(),
  maxPriceInCents: z.coerce.number().int().min(0).optional(),
  condition: z.enum(['BRAND_NEW', 'RECONDITIONED', 'USED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['priceInCents', 'averageRating', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
