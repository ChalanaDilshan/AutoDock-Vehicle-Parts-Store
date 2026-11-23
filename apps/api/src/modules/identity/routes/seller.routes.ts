import { Router } from 'express';
import { sellerController } from '../controllers/seller.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

export const sellerRouter = Router();

sellerRouter.use(requireAuth);

sellerRouter.post('/register', sellerController.registerSeller);

// Seller authenticated endpoints
sellerRouter.get('/me', requireRole('SELLER', 'ADMIN'), sellerController.getSellerMe);
sellerRouter.post('/me/documents', requireRole('SELLER', 'ADMIN'), sellerController.uploadDocument);
sellerRouter.get('/me/documents', requireRole('SELLER', 'ADMIN'), sellerController.getDocuments);
sellerRouter.post('/me/bank-details', requireRole('SELLER', 'ADMIN'), sellerController.submitBankDetails);
sellerRouter.post(
  '/me/privacy-acknowledgement',
  requireRole('SELLER', 'ADMIN'),
  sellerController.acknowledgePrivacy
);
sellerRouter.post('/me/submit', requireRole('SELLER', 'ADMIN'), sellerController.submitApplication);
