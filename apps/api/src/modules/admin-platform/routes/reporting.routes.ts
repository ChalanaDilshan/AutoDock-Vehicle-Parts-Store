import { Router } from 'express';
import { reportingController } from '../controllers/reporting.controller.js';
import { requireAuth, requireRole } from '../../identity/middleware/auth.middleware.js';

export const adminDashboardRouter = Router();
export const adminReportRouter = Router();

adminDashboardRouter.get(
  '/summary',
  requireAuth,
  requireRole('ADMIN'),
  reportingController.getDashboardSummary.bind(reportingController)
);

adminReportRouter.get(
  '/:reportType',
  requireAuth,
  requireRole('ADMIN'),
  reportingController.getReport.bind(reportingController)
);
