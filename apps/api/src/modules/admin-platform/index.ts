import { Router } from 'express';
import { adminNotificationRouter } from './routes/notification.routes.js';
import { adminAuditRouter } from './routes/audit.routes.js';
import {
  adminDashboardRouter,
  adminReportRouter,
} from './routes/reporting.routes.js';

export * from './models/notification.model.js';
export * from './models/notificationDelivery.model.js';
export * from './models/auditEvent.model.js';
export * from './models/platformMetricSnapshot.model.js';
export * from './contracts/adminPlatform.contract.js';
export * from './services/emailDelivery.service.js';
export * from './services/audit.service.js';
export * from './services/notification.service.js';
export * from './services/adminPlatformEvent.service.js';
export * from './services/reporting.service.js';
export * from './routes/notification.routes.js';
export * from './routes/audit.routes.js';
export * from './routes/reporting.routes.js';

/**
 * Composite router for MOD-05 Administration Platform.
 */
export const adminPlatformRouter = Router();

adminPlatformRouter.get('/health', (_req, res) => {
  res.json({
    module: 'MOD-05 Administration, Notifications & Reporting',
    status: 'READY',
  });
});

// Nested administrative routes
adminPlatformRouter.use('/notifications', adminNotificationRouter);
adminPlatformRouter.use('/audit-logs', adminAuditRouter);
adminPlatformRouter.use('/dashboard', adminDashboardRouter);
adminPlatformRouter.use('/reports', adminReportRouter);
