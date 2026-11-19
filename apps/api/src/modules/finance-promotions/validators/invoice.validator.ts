import { z } from 'zod';

export const GenerateInvoicesSchema = z.object({
  billingPeriod: z
    .string({ required_error: 'billingPeriod is required' })
    .regex(/^\d{4}-\d{2}$/, 'billingPeriod must be in YYYY-MM format (e.g. 2026-11)'),
});

export const InvoiceQuerySchema = z.object({
  sellerId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  billingPeriod: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  status: z
    .enum([
      'ISSUED',
      'PAYMENT_PENDING_VERIFICATION',
      'PARTIALLY_PAID',
      'PAID',
      'OVERDUE',
      'CANCELLED',
    ])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const UploadInvoiceReceiptSchema = z.object({
  fileName: z
    .string({ required_error: 'fileName is required' })
    .trim()
    .min(3, 'File name must be at least 3 characters')
    .max(255),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], {
    required_error: 'MIME type must be JPEG, PNG, WebP or PDF',
  }),
  fileSizeBytes: z
    .number({ required_error: 'fileSizeBytes is required' })
    .int()
    .min(1)
    .max(5242880, 'File size cannot exceed 5MB'),
  fileContentBase64: z.string().optional(),
  claimedAmountInCents: z
    .number({ required_error: 'claimedAmountInCents is required' })
    .int('claimedAmountInCents must be an integer cents value')
    .min(1, 'claimedAmountInCents must be at least 1 cent'),
  depositDate: z.string().or(z.date()).optional(),
});

export const VerifyInvoiceReceiptSchema = z
  .object({
    action: z.enum(['APPROVE', 'REJECT'], { required_error: 'action must be APPROVE or REJECT' }),
    depositedAmountInCents: z
      .number()
      .int()
      .min(1)
      .optional(),
    bankTransactionReference: z
      .string()
      .trim()
      .max(100)
      .optional(),
    rejectionReason: z
      .string()
      .trim()
      .max(500)
      .optional(),
    adminNotes: z
      .string()
      .trim()
      .max(500)
      .optional(),
  })
  .refine(
    (data) => {
      if (data.action === 'REJECT') {
        return !!data.rejectionReason && data.rejectionReason.length >= 5;
      }
      return true;
    },
    {
      message: 'rejectionReason is required (min 5 characters) when rejecting a receipt',
      path: ['rejectionReason'],
    }
  );

export const PlatformBankAccountSchema = z.object({
  bankName: z.string().trim().min(2).max(100),
  accountHolderName: z.string().trim().min(2).max(100),
  accountNumber: z.string().trim().min(6).max(30),
  branchName: z.string().trim().min(2).max(100),
  branchCode: z.string().trim().max(10).optional(),
  paymentInstructions: z.string().trim().min(10).max(1000),
});
