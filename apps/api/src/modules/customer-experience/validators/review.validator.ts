import { z } from 'zod';

export const SubmitReviewSchema = z.object({
  productId: z
    .string({ required_error: 'Product ID is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  suborderId: z
    .string({ required_error: 'Suborder ID is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid suborder ID'),
  rating: z
    .number({ required_error: 'Rating is required' })
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
  title: z.string().max(100, 'Title cannot exceed 100 characters').trim().optional().nullable(),
  comment: z
    .string({ required_error: 'Comment is required' })
    .min(10, 'Comment must be at least 10 characters')
    .max(1000, 'Comment cannot exceed 1000 characters')
    .trim(),
  images: z.array(z.string().url('Each image must be a valid URL')).max(5, 'Maximum 5 images').optional(),
});

export const ModerateReviewSchema = z.object({
  action: z.enum(['HIDE', 'RESTORE'], { required_error: 'Action must be HIDE or RESTORE' }),
  moderationReason: z
    .string({ required_error: 'Moderation reason is required' })
    .min(5, 'Reason must be at least 5 characters')
    .max(300, 'Reason cannot exceed 300 characters')
    .trim(),
});
