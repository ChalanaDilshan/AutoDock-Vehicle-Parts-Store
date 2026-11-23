import mongoose from 'mongoose';
import { AuditEvent, IAuditEvent } from '../models/auditEvent.model.js';
import { IAuditEventIngestInput } from '../contracts/adminPlatform.contract.js';
import { AppError } from '../../../shared/middleware/errorHandler.js';

const SENSITIVE_AUDIT_KEYS = new Set([
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'accountNumber',
  'cvv',
  'storageKey',
  's3StorageKey',
]);

function sanitizeAuditValue(key: string, value: unknown): unknown {
  if (SENSITIVE_AUDIT_KEYS.has(key)) {
    return '[REDACTED]';
  }
  if (value && typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map((item) => sanitizeAuditValue(key, item));
    }
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      clean[k] = sanitizeAuditValue(k, v);
    }
    return clean;
  }
  return value;
}

export interface AuditLogQueryFilter {
  action?: string;
  sourceModule?: string;
  severity?: string;
  actorRole?: string;
  actorId?: string;
  targetEntityType?: string;
  targetEntityId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export class AuditService {
  /**
   * Appends an immutable security audit event. Sanitizes sensitive keys.
   */
  public async recordAuditEvent(input: IAuditEventIngestInput): Promise<IAuditEvent> {
    // Sanitize delta fields
    const sanitizedDelta = input.delta?.map((item) => ({
      field: item.field,
      oldValue: sanitizeAuditValue(item.field, item.oldValue),
      newValue: sanitizeAuditValue(item.field, item.newValue),
    }));

    const audit = new AuditEvent({
      action: input.action,
      sourceModule: input.sourceModule,
      severity: input.severity || 'MEDIUM',
      actor: {
        actorId: input.actorId,
        actorRole: input.actorRole,
        email: input.actorEmail || null,
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
      },
      targetEntity: {
        entityType: input.targetEntityType,
        entityId: input.targetEntityId,
        publicReference: input.publicReference || null,
      },
      delta: sanitizedDelta || [],
      reason: input.reason || null,
      requestId: input.requestId || null,
      correlationId: input.correlationId || null,
      timestamp: input.timestamp || new Date(),
    });

    await audit.save();
    return audit;
  }

  /**
   * Admin: Search & paginate audit records.
   */
  public async searchAuditLogs(filter: AuditLogQueryFilter): Promise<{
    logs: IAuditEvent[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const query: Record<string, unknown> = {};

    if (filter.action) query.action = filter.action;
    if (filter.sourceModule) query.sourceModule = filter.sourceModule;
    if (filter.severity) query.severity = filter.severity;
    if (filter.actorRole) query['actor.actorRole'] = filter.actorRole;
    if (filter.actorId) query['actor.actorId'] = filter.actorId;
    if (filter.targetEntityType) query['targetEntity.entityType'] = filter.targetEntityType;
    if (filter.targetEntityId) query['targetEntity.entityId'] = filter.targetEntityId;

    if (filter.startDate || filter.endDate) {
      const timeQuery: Record<string, Date> = {};
      if (filter.startDate) timeQuery.$gte = filter.startDate;
      if (filter.endDate) timeQuery.$lte = filter.endDate;
      query.timestamp = timeQuery;
    }

    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, Math.min(100, filter.limit || 20));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditEvent.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit),
      AuditEvent.countDocuments(query),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Admin: Get audit record by ID.
   */
  public async getAuditLogById(id: string): Promise<IAuditEvent> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid audit log ID format', 400, 'INVALID_ID');
    }

    const record = await AuditEvent.findById(id);
    if (!record) {
      throw new AppError('Audit record not found', 404, 'NOT_FOUND');
    }

    return record;
  }
}

export const auditService = new AuditService();
