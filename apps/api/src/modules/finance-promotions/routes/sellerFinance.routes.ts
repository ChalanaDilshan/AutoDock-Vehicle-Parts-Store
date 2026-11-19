import { Router } from 'express';
import { sellerFinanceController } from '../controllers/sellerFinance.controller.js';
import { requireAuth, requireRole } from '../../identity/middleware/auth.middleware.js';

export const sellerFinanceRouter = Router();

sellerFinanceRouter.use(requireAuth);
sellerFinanceRouter.use(requireRole('SELLER'));

sellerFinanceRouter.get('/summary', (req, res, next) => sellerFinanceController.getSummary(req, res, next));
sellerFinanceRouter.get('/invoices', (req, res, next) => sellerFinanceController.getInvoices(req, res, next));
sellerFinanceRouter.get('/invoices/:id', (req, res, next) => sellerFinanceController.getInvoiceById(req, res, next));
sellerFinanceRouter.post('/invoices/:id/receipt', (req, res, next) => sellerFinanceController.uploadReceipt(req, res, next));
sellerFinanceRouter.get('/invoices/:id/receipts', (req, res, next) => sellerFinanceController.getReceipts(req, res, next));
sellerFinanceRouter.get('/invoices/:id/receipts/:receiptId/view', (req, res, next) => sellerFinanceController.streamReceipt(req, res, next));
sellerFinanceRouter.get('/subsidies', (req, res, next) => sellerFinanceController.getSubsidies(req, res, next));
