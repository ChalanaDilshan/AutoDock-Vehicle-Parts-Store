import { z } from 'zod';

export const AuditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  action: z.string().optional(),
  sourceModule: z.enum(['MOD-01', 'MOD-02', 'MOD-03', 'MOD-04', 'MOD-05']).optional(),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  actorRole: z.enum(['ADMIN', 'SELLER', 'CUSTOMER', 'SYSTEM']).optional(),
  actorId: z.string().optional(),
  targetEntityType: z.string().optional(),
  targetEntityId: z.string().optional(),
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
});
