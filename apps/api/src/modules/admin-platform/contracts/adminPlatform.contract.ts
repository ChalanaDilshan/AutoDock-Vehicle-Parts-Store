export interface IPlatformDomainEvent<T = Record<string, any>> {
  eventId: string;
  sourceModule: 'MOD-01' | 'MOD-02' | 'MOD-03' | 'MOD-04' | 'MOD-05';
  eventName: string;
  timestamp: Date;
  correlationId?: string;
  payload: T;
}

export interface IAuditEventIngestInput {
  action: string;
  sourceModule: 'MOD-01' | 'MOD-02' | 'MOD-03' | 'MOD-04' | 'MOD-05';
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  actorId: string;
  actorRole: 'ADMIN' | 'SELLER' | 'CUSTOMER' | 'SYSTEM';
  actorEmail?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  targetEntityType: string;
  targetEntityId: string;
  publicReference?: string | null;
  delta?: Array<{ field: string; oldValue: unknown; newValue: unknown }>;
  reason?: string | null;
  requestId?: string | null;
  correlationId?: string | null;
  timestamp?: Date;
}

export interface INotificationDispatchInput {
  recipientId: string;
  recipientRole?: 'CUSTOMER' | 'SELLER' | 'ADMIN';
  recipientEmail?: string;
  templateId: string;
  subject: string;
  category?: 'ORDER' | 'PAYMENT' | 'VERIFICATION' | 'FINANCE' | 'SYSTEM' | 'SECURITY';
  priority?: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
  actionUrl?: string | null;
  bodyData: Record<string, any>;
  sourceModule?: 'MOD-01' | 'MOD-02' | 'MOD-03' | 'MOD-04' | 'MOD-05';
  sourceEventId?: string;
  sourceEventName?: string;
}

export interface IAdminPlatformPublicService {
  ingestDomainEvent(event: IPlatformDomainEvent): Promise<{ accepted: boolean; duplicateIgnored?: boolean }>;
  logAudit(input: IAuditEventIngestInput): Promise<string>;
  dispatchNotification(input: INotificationDispatchInput): Promise<{ inAppCreated: boolean; emailEnqueued: boolean }>;
}
