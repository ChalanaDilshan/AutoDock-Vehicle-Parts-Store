import { z } from 'zod';

export const UploadPaymentReceiptSchema = z.object({
  fileName: z.string().trim().min(1, 'File name is required').max(255),
  mimeType: z.enum(['application/pdf', 'image/jpeg', 'image/png', 'image/webp'], {
    errorMap: () => ({
      message: 'MIME type must be application/pdf, image/jpeg, image/png, or image/webp',
    }),
  }),
  fileSizeBytes: z
    .number()
    .int()
    .min(10, 'File size too small')
    .max(5242880, 'File size cannot exceed 5 MB'),
  fileContentBase64: z.string().optional(),
  depositedAmountInCents: z.number().int().positive().optional(),
  referenceNumber: z.string().trim().max(100).optional(),
});

export const VerifyReceiptSchema = z
  .object({
    action: z.enum(['APPROVE', 'REJECT'], {
      required_error: 'action must be either APPROVE or REJECT',
    }),
    rejectionReason: z
      .string()
      .trim()
      .min(5, 'Rejection reason must be at least 5 characters')
      .max(300, 'Rejection reason must not exceed 300 characters')
      .optional(),
  })
  .refine(
    (data) => {
      if (data.action === 'REJECT' && !data.rejectionReason) {
        return false;
      }
      return true;
    },
    {
      message: 'rejectionReason is mandatory when rejecting a payment slip',
      path: ['rejectionReason'],
    }
  );

export const InitiateCardPaymentSchema = z.object({
  suborderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid suborderId format'),
});

export const CardWebhookSchema = z.object({
  eventId: z.string().min(1),
  suborderId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  eventType: z.enum(['PAYMENT_SUCCESS', 'PAYMENT_FAILED']),
  amountInCents: z.number().int().positive(),
  currency: z.literal('LKR'),
  timestamp: z.string(),
});

export type UploadPaymentReceiptInput = z.infer<typeof UploadPaymentReceiptSchema>;
export type VerifyReceiptInput = z.infer<typeof VerifyReceiptSchema>;
export type InitiateCardPaymentInput = z.infer<typeof InitiateCardPaymentSchema>;
export type CardWebhookInput = z.infer<typeof CardWebhookSchema>;
