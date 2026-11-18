import { z } from 'zod';

export const DeliveryRateProposalSchema = z.object({
  rates: z
    .array(
      z.object({
        district: z.string().trim().min(2, 'District name is required').max(50),
        feeInCents: z
          .number({ required_error: 'feeInCents is required' })
          .int('feeInCents must be an integer')
          .nonnegative('feeInCents must be non-negative'),
        estimatedDaysMin: z
          .number()
          .int()
          .min(1, 'Minimum delivery days must be at least 1')
          .max(30, 'Minimum delivery days cannot exceed 30'),
        estimatedDaysMax: z
          .number()
          .int()
          .min(1, 'Maximum delivery days must be at least 1')
          .max(30, 'Maximum delivery days cannot exceed 30'),
      })
    )
    .min(1, 'At least one district delivery rate proposal is required'),
});

export const AdminProposalDecisionSchema = z
  .object({
    decision: z.enum(['APPROVE', 'REJECT'], {
      required_error: 'decision must be either APPROVE or REJECT',
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
      if (data.decision === 'REJECT' && !data.rejectionReason) {
        return false;
      }
      return true;
    },
    {
      message: 'rejectionReason is mandatory when rejecting a delivery rate proposal',
      path: ['rejectionReason'],
    }
  );

export type DeliveryRateProposalInput = z.infer<typeof DeliveryRateProposalSchema>;
export type AdminProposalDecisionInput = z.infer<typeof AdminProposalDecisionSchema>;
