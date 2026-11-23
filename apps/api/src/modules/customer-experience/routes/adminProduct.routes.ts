import { Router } from 'express';
import { adminModerateProduct } from '../controllers/adminProduct.controller.js';
import { requireAuth, requireRole } from '../../identity/index.js';

export const adminProductRouter = Router();

adminProductRouter.use(requireAuth);
adminProductRouter.use(requireRole('ADMIN'));

adminProductRouter.patch('/:id/moderation', adminModerateProduct);
