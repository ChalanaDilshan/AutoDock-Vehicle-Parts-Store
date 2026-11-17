import { Router } from 'express';
import { submitReview } from '../controllers/review.controller.js';
import { requireAuth, requireRole } from '../../identity/index.js';

export const reviewRouter = Router();

// Customer only review submission
reviewRouter.post('/', requireAuth, requireRole('CUSTOMER'), submitReview);
