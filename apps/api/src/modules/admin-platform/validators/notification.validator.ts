import { z } from 'zod';

export const ListNotificationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  isRead: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
  category: z
    .enum(['ORDER', 'PAYMENT', 'VERIFICATION', 'FINANCE', 'SYSTEM', 'SECURITY'])
    .optional(),
});

export const AdminAlertQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  category: z.string().optional(),
  priority: z.enum(['CRITICAL', 'HIGH', 'NORMAL', 'LOW']).optional(),
});

export const DeliveryHealthQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum(['PENDING', 'QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'FAILED', 'RETRYING', 'CANCELLED'])
    .optional(),
  channel: z.enum(['EMAIL', 'IN_APP']).optional(),
});
