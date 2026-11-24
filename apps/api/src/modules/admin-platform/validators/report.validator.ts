import { z } from 'zod';

export const DashboardQuerySchema = z.object({
  refresh: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
});

export const ReportQuerySchema = z.object({
  startDate: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  endDate: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  sellerId: z.string().optional(),
  format: z.enum(['json', 'csv']).default('json'),
});
