import { Router } from 'express';
import { adminSellerController } from '../controllers/adminSeller.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

export const adminSellerRouter = Router();

adminSellerRouter.use(requireAuth, requireRole('ADMIN'));

adminSellerRouter.get('/', adminSellerController.listSellers);
adminSellerRouter.get('/:id', adminSellerController.getSellerDetail);
adminSellerRouter.post('/:id/review', adminSellerController.reviewSeller);
adminSellerRouter.patch('/:id/bank-details/verify', adminSellerController.verifyBankDetails);
adminSellerRouter.get('/:id/documents/:docId/view-url', adminSellerController.getDocumentViewUrl);
