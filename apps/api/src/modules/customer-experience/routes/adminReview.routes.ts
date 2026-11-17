import { Router } from 'express';
import { adminGetReviews, adminModerateReview } from '../controllers/review.controller.js';
import { requireAuth, requireRole } from '../../identity/index.js';

export const adminReviewRouter = Router();

adminReviewRouter.use(requireAuth);
adminReviewRouter.use(requireRole('ADMIN'));

adminReviewRouter.get('/', adminGetReviews);
adminReviewRouter.patch('/:id/moderation', adminModerateReview);
