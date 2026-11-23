import { z } from 'zod';

export const ConfigureCommissionRateSchema = z.object({
  basisPoints: z
    .number({ required_error: 'basisPoints is required' })
    .int('basisPoints must be an integer')
    .min(0, 'basisPoints cannot be negative')
    .max(3500, 'basisPoints cannot exceed 3500 (35.00%)'),
  effectiveFrom: z
    .string()
    .datetime({ offset: true })
    .or(z.date())
    .optional(),
  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(3, 'Description must be at least 3 characters')
    .max(200, 'Description cannot exceed 200 characters'),
});

export const CreateSellerExemptionSchema = z.object({
  sellerId: z
    .string({ required_error: 'sellerId is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid sellerId format'),
  reason: z
    .string({ required_error: 'Reason is required' })
    .trim()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason cannot exceed 500 characters'),
});

export const RevokeSellerExemptionSchema = z.object({
  reason: z
    .string({ required_error: 'Reason for revocation is required' })
    .trim()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason cannot exceed 500 characters'),
});

export const CommissionLedgerQuerySchema = z.object({
  sellerId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  orderId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  suborderId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  status: z.enum(['ACCRUED', 'INVOICED', 'ADJUSTED']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
