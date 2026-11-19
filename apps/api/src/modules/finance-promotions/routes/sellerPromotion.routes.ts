import { Router } from 'express';
import { sellerPromotionController } from '../controllers/sellerPromotion.controller.js';
import { requireAuth, requireRole } from '../../identity/middleware/auth.middleware.js';

export const sellerPromotionRouter = Router();

sellerPromotionRouter.use(requireAuth);
sellerPromotionRouter.use(requireRole('SELLER'));

sellerPromotionRouter.post('/', (req, res, next) => sellerPromotionController.createPromotion(req, res, next));
sellerPromotionRouter.get('/', (req, res, next) => sellerPromotionController.getPromotions(req, res, next));
sellerPromotionRouter.get('/:id', (req, res, next) => sellerPromotionController.getPromotionById(req, res, next));
sellerPromotionRouter.patch('/:id/status', (req, res, next) => sellerPromotionController.updateStatus(req, res, next));
