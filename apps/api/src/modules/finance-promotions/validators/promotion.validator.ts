import { z } from 'zod';

export const CreateSellerPromotionSchema = z
  .object({
    code: z
      .string({ required_error: 'Coupon code is required' })
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{4,20}$/, 'Code must be 4-20 alphanumeric characters, dashes, or underscores'),
    title: z.string().trim().min(3).max(100),
    description: z.string().trim().max(500).optional(),
    discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
    discountValue: z
      .number({ required_error: 'discountValue is required' })
      .int()
      .min(1),
    minSpendInCents: z.number().int().min(0).default(0),
    maxDiscountInCents: z.number().int().min(1).optional(),
    applicableProductIds: z
      .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid productId format'))
      .optional()
      .default([]),
    startDate: z.string().or(z.date()),
    endDate: z.string().or(z.date()),
    totalUsageLimit: z.number().int().min(1).optional(),
    perCustomerLimit: z.number().int().min(1).default(1),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate).getTime();
      const end = new Date(data.endDate).getTime();
      return end > start;
    },
    { message: 'endDate must be after startDate', path: ['endDate'] }
  )
  .refine(
    (data) => {
      if (data.discountType === 'PERCENTAGE') {
        return data.discountValue >= 100 && data.discountValue <= 5000; // 1.00% to 50.00%
      }
      return true;
    },
    { message: 'Percentage discount must be between 100 (1%) and 5000 (50%) basis points', path: ['discountValue'] }
  );

export const CreateAdminPromotionSchema = z
  .object({
    code: z
      .string({ required_error: 'Coupon code is required' })
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{4,20}$/, 'Code must be 4-20 alphanumeric characters, dashes, or underscores'),
    title: z.string().trim().min(3).max(100),
    description: z.string().trim().max(500).optional(),
    discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
    discountValue: z.number().int().min(1),
    minSpendInCents: z.number().int().min(0).default(0),
    maxDiscountInCents: z.number().int().min(1).optional(),
    applicableCategoryIds: z
      .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid categoryId format'))
      .optional()
      .default([]),
    applicableProductIds: z
      .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid productId format'))
      .optional()
      .default([]),
    startDate: z.string().or(z.date()),
    endDate: z.string().or(z.date()),
    totalUsageLimit: z.number().int().min(1).optional(),
    perCustomerLimit: z.number().int().min(1).default(1),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate).getTime();
      const end = new Date(data.endDate).getTime();
      return end > start;
    },
    { message: 'endDate must be after startDate', path: ['endDate'] }
  );

export const UpdatePromotionStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
});
