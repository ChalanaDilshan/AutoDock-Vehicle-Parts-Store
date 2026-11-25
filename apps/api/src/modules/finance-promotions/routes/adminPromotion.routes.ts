import { Router } from 'express';
import { adminPromotionController } from '../controllers/adminPromotion.controller.js';
import { requireAuth, requireRole } from '../../identity/middleware/auth.middleware.js';

export const adminPromotionRouter = Router();

adminPromotionRouter.use(requireAuth);
adminPromotionRouter.use(requireRole('ADMIN'));

adminPromotionRouter.post('/', (req, res, next) => adminPromotionController.createPromotion(req, res, next));
adminPromotionRouter.get('/', (req, res, next) => adminPromotionController.getPromotions(req, res, next));
adminPromotionRouter.get('/subsidies', (req, res, next) => adminPromotionController.getSubsidies(req, res, next));
adminPromotionRouter.get('/:id', (req, res, next) => adminPromotionController.getPromotionById(req, res, next));
adminPromotionRouter.patch('/:id/status', (req, res, next) => adminPromotionController.updateStatus(req, res, next));
