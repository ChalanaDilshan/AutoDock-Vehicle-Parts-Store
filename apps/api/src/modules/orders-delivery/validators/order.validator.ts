import { z } from 'zod';

export const OrderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.string().trim().optional(),
});

export const UpdateSuborderStatusSchema = z
  .object({
    status: z.enum(['PROCESSING', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'CANCELLED'], {
      required_error: 'Valid fulfillment status is required',
    }),
    courierDetails: z
      .object({
        courierName: z.string().trim().min(2, 'Courier name must be at least 2 characters').max(100),
        trackingNumber: z.string().trim().min(2, 'Tracking number must be at least 2 characters').max(100),
        trackingUrl: z.string().trim().url('Tracking URL must be a valid URL').optional(),
      })
      .optional(),
    sellerNotes: z.string().trim().max(500).optional(),
  })
  .refine(
    (data) => {
      if (data.status === 'DISPATCHED' && !data.courierDetails) {
        return false;
      }
      return true;
    },
    {
      message: 'courierDetails (courierName and trackingNumber) are required when dispatching',
      path: ['courierDetails'],
    }
  );

export const CancelSuborderSchema = z.object({
  reason: z.string().trim().max(300).optional(),
});

export type OrderQueryInput = z.infer<typeof OrderQuerySchema>;
export type UpdateSuborderStatusInput = z.infer<typeof UpdateSuborderStatusSchema>;
export type CancelSuborderInput = z.infer<typeof CancelSuborderSchema>;
