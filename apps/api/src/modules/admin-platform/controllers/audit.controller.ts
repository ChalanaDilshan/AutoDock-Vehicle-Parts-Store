import { Request, Response, NextFunction } from 'express';
import { auditService } from '../services/audit.service.js';
import { AuditLogQuerySchema } from '../validators/audit.validator.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';

export class AuditController {
  public async searchAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = AuditLogQuerySchema.parse(req.query);
      const result = await auditService.searchAuditLogs(query);

      sendSuccess({
        res,
        code: 'AUDIT_LOGS_RETRIEVED',
        message: 'Security audit logs retrieved successfully',
        data: result.logs.map((l) => ({
          id: l._id.toString(),
          action: l.action,
          sourceModule: l.sourceModule,
          severity: l.severity,
          actor: {
            actorId: l.actor.actorId,
            actorRole: l.actor.actorRole,
            email: l.actor.email,
            ipAddress: l.actor.ipAddress,
          },
          targetEntity: l.targetEntity,
          delta: l.delta,
          reason: l.reason,
          requestId: l.requestId,
          timestamp: l.timestamp,
        })),
        meta: {
          pagination: result.pagination,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async getAuditLogById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const record = await auditService.getAuditLogById(id);

      sendSuccess({
        res,
        code: 'AUDIT_DETAIL_RETRIEVED',
        data: {
          id: record._id.toString(),
          action: record.action,
          sourceModule: record.sourceModule,
          severity: record.severity,
          actor: record.actor,
          targetEntity: record.targetEntity,
          delta: record.delta,
          reason: record.reason,
          requestId: record.requestId,
          correlationId: record.correlationId,
          timestamp: record.timestamp,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const auditController = new AuditController();
