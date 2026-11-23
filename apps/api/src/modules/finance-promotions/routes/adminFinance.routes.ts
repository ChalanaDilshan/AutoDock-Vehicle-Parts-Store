import { Router } from 'express';
import { adminFinanceController } from '../controllers/adminFinance.controller.js';
import { requireAuth, requireRole } from '../../identity/middleware/auth.middleware.js';

export const adminFinanceRouter = Router();

adminFinanceRouter.use(requireAuth);
adminFinanceRouter.use(requireRole('ADMIN'));

adminFinanceRouter.get('/commission-rate', (req, res, next) => adminFinanceController.getCommissionRate(req, res, next));
adminFinanceRouter.post('/commission-rate', (req, res, next) => adminFinanceController.configureCommissionRate(req, res, next));

adminFinanceRouter.get('/exemptions', (req, res, next) => adminFinanceController.getExemptions(req, res, next));
adminFinanceRouter.post('/exemptions', (req, res, next) => adminFinanceController.grantExemption(req, res, next));
adminFinanceRouter.delete('/exemptions/:sellerId', (req, res, next) => adminFinanceController.revokeExemption(req, res, next));

adminFinanceRouter.get('/commission-ledger', (req, res, next) => adminFinanceController.getCommissionLedger(req, res, next));

adminFinanceRouter.get('/invoices', (req, res, next) => adminFinanceController.getInvoices(req, res, next));
adminFinanceRouter.get('/invoices/:id', (req, res, next) => adminFinanceController.getInvoiceById(req, res, next));
adminFinanceRouter.post('/invoices/generate', (req, res, next) => adminFinanceController.generateInvoices(req, res, next));

adminFinanceRouter.get('/payment-verification-queue', (req, res, next) => adminFinanceController.getPaymentVerificationQueue(req, res, next));
adminFinanceRouter.post('/invoices/:id/receipts/:receiptId/verify', (req, res, next) => adminFinanceController.verifyPaymentReceipt(req, res, next));

adminFinanceRouter.get('/platform-bank-account', (req, res, next) => adminFinanceController.getPlatformBankSettings(req, res, next));
adminFinanceRouter.put('/platform-bank-account', (req, res, next) => adminFinanceController.updatePlatformBankSettings(req, res, next));
