import { Router } from 'express';
import { auditController } from '../controllers/audit.controller.js';
import { requireAuth, requireRole } from '../../identity/middleware/auth.middleware.js';

export const adminAuditRouter = Router();

adminAuditRouter.get(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  auditController.searchAuditLogs.bind(auditController)
);

adminAuditRouter.get(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  auditController.getAuditLogById.bind(auditController)
);
