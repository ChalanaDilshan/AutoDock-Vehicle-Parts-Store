import mongoose, { Schema, Document } from 'mongoose';

export type AuditSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface IAuditActor {
  actorId: mongoose.Types.ObjectId | string;
  actorRole: 'ADMIN' | 'SELLER' | 'CUSTOMER' | 'SYSTEM';
  email?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface IAuditTarget {
  entityType: string;
  entityId: string;
  publicReference?: string | null;
}

export interface IAuditFieldDelta {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface IAuditEvent extends Document {
  action: string;
  sourceModule: 'MOD-01' | 'MOD-02' | 'MOD-03' | 'MOD-04' | 'MOD-05';
  severity: AuditSeverity;
  actor: IAuditActor;
  targetEntity: IAuditTarget;
  delta?: IAuditFieldDelta[];
  reason?: string | null;
  requestId?: string | null;
  correlationId?: string | null;
  timestamp: Date;
}

const AuditEventSchema = new Schema<IAuditEvent>(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    sourceModule: {
      type: String,
      enum: ['MOD-01', 'MOD-02', 'MOD-03', 'MOD-04', 'MOD-05'],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      default: 'MEDIUM',
      index: true,
    },
    actor: {
      actorId: { type: Schema.Types.Mixed, required: true, index: true },
      actorRole: { type: String, required: true },
      email: { type: String, default: null },
      ipAddress: { type: String, default: null },
      userAgent: { type: String, default: null },
    },
    targetEntity: {
      entityType: { type: String, required: true, index: true },
      entityId: { type: String, required: true, index: true },
      publicReference: { type: String, default: null },
    },
    delta: [
      {
        field: { type: String, required: true },
        oldValue: { type: Schema.Types.Mixed },
        newValue: { type: Schema.Types.Mixed },
        _id: false,
      },
    ],
    reason: {
      type: String,
      default: null,
      maxlength: 1000,
    },
    requestId: {
      type: String,
      default: null,
      index: true,
    },
    correlationId: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      immutable: true,
      index: true,
    },
  },
  {
    timestamps: false,
    collection: 'audit_events',
  }
);

// Append-Only Protection: Disallow modifications or deletions on audit records
AuditEventSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany'], function () {
  throw new Error('AUDIT_IMMUTABILITY_VIOLATION: AuditEvent documents are append-only and cannot be mutated or deleted.');
});

// Indexes
AuditEventSchema.index({ sourceModule: 1, action: 1, timestamp: -1 });
AuditEventSchema.index({ 'actor.actorId': 1, timestamp: -1 });
AuditEventSchema.index({ 'targetEntity.entityType': 1, 'targetEntity.entityId': 1 });

export const AuditEvent = mongoose.model<IAuditEvent>('AuditEvent', AuditEventSchema);
