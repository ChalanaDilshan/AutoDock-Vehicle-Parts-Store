import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../../../src/app.js';
import { env } from '../../../src/config/env.js';
import { AuditEvent } from '../../../src/modules/admin-platform/models/auditEvent.model.js';
import { auditService } from '../../../src/modules/admin-platform/services/audit.service.js';

describe('MOD-05 Security Audit Trail Tests', () => {
  const app = createApp();
  const testDbUri = 'mongodb://localhost:27017/autodock_test_mod05_audit';

  const adminId = new mongoose.Types.ObjectId().toString();
  const customerId = new mongoose.Types.ObjectId().toString();

  const tokenAdmin = jwt.sign(
    { userId: adminId, email: 'admin@autodock.lk', role: 'ADMIN' },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '1h' }
  );

  const tokenCustomer = jwt.sign(
    { userId: customerId, email: 'customer@example.com', role: 'CUSTOMER' },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '1h' }
  );

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(testDbUri);
  });

  afterAll(async () => {
    await AuditEvent.deleteMany({}).catch(() => {});
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Drop collection directly to reset between tests (bypassing pre-hooks)
    if (mongoose.connection.db) {
      await mongoose.connection.db.collection('audit_events').deleteMany({});
    }
  });

  it('TC-AUDIT-01: Immutable Audit Trail prevents update and delete via Mongoose pre-hooks', async () => {
    const record = await auditService.recordAuditEvent({
      action: 'SELLER_APPLICATION_REVIEWED',
      sourceModule: 'MOD-01',
      severity: 'CRITICAL',
      actorId: adminId,
      actorRole: 'ADMIN',
      targetEntityType: 'SELLER_PROFILE',
      targetEntityId: '67420b9e8f7a6b5c4d3e2001',
      delta: [{ field: 'verificationStatus', oldValue: 'PENDING', newValue: 'APPROVED' }],
    });

    // Attempting updateOne throws AUDIT_IMMUTABILITY_VIOLATION
    await expect(
      AuditEvent.updateOne({ _id: record._id }, { $set: { action: 'TAMPERED_ACTION' } })
    ).rejects.toThrow('AUDIT_IMMUTABILITY_VIOLATION');

    // Attempting deleteOne throws AUDIT_IMMUTABILITY_VIOLATION
    await expect(AuditEvent.deleteOne({ _id: record._id })).rejects.toThrow(
      'AUDIT_IMMUTABILITY_VIOLATION'
    );
  });

  it('TC-AUDIT-02: Sensitive keys in delta are automatically sanitized with [REDACTED]', async () => {
    const record = await auditService.recordAuditEvent({
      action: 'BANK_SETTINGS_UPDATED',
      sourceModule: 'MOD-04',
      severity: 'HIGH',
      actorId: adminId,
      actorRole: 'ADMIN',
      targetEntityType: 'PLATFORM_BANK_SETTINGS',
      targetEntityId: 'SETTINGS_001',
      delta: [
        { field: 'bankName', oldValue: 'Commercial Bank', newValue: 'BOC' },
        { field: 'accountNumber', oldValue: '8910001234', newValue: '8910005678' },
        { field: 'secret', oldValue: 'old_secret_key', newValue: 'new_secret_key' },
      ],
    });

    expect(record.delta).toHaveLength(3);
    const bankNameDelta = record.delta?.find((d) => d.field === 'bankName');
    const accountDelta = record.delta?.find((d) => d.field === 'accountNumber');
    const secretDelta = record.delta?.find((d) => d.field === 'secret');

    expect(bankNameDelta?.newValue).toBe('BOC');
    expect(accountDelta?.oldValue).toBe('[REDACTED]');
    expect(accountDelta?.newValue).toBe('[REDACTED]');
    expect(secretDelta?.oldValue).toBe('[REDACTED]');
    expect(secretDelta?.newValue).toBe('[REDACTED]');
  });

  it('TC-AUDIT-03: Security gate forbids non-admins from querying audit logs (403 Forbidden)', async () => {
    // Unauthenticated
    await request(app).get('/api/v1/admin/audit-logs').expect(401);

    // Authenticated as Customer
    await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${tokenCustomer}`)
      .expect(403);
  });

  it('TC-AUDIT-04: Admin searches and filters audit records with pagination', async () => {
    await auditService.recordAuditEvent({
      action: 'COMMISSION_RATE_CONFIGURED',
      sourceModule: 'MOD-04',
      severity: 'CRITICAL',
      actorId: adminId,
      actorRole: 'ADMIN',
      targetEntityType: 'COMMISSION_RATE',
      targetEntityId: 'RATE_001',
    });

    await auditService.recordAuditEvent({
      action: 'PRODUCT_MODERATED',
      sourceModule: 'MOD-02',
      severity: 'HIGH',
      actorId: adminId,
      actorRole: 'ADMIN',
      targetEntityType: 'PRODUCT',
      targetEntityId: 'PROD_001',
    });

    // Query all records
    const resAll = await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    expect(resAll.body.success).toBe(true);
    expect(resAll.body.data).toHaveLength(2);
    expect(resAll.body.meta.pagination.total).toBe(2);

    // Filter by sourceModule=MOD-04
    const resFiltered = await request(app)
      .get('/api/v1/admin/audit-logs?sourceModule=MOD-04')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    expect(resFiltered.body.data).toHaveLength(1);
    expect(resFiltered.body.data[0].action).toBe('COMMISSION_RATE_CONFIGURED');
  });

  it('TC-AUDIT-05: Admin retrieves audit log detail by ID', async () => {
    const record = await auditService.recordAuditEvent({
      action: 'SELLER_EXEMPTION_GRANTED',
      sourceModule: 'MOD-04',
      severity: 'HIGH',
      actorId: adminId,
      actorRole: 'ADMIN',
      targetEntityType: 'SELLER_EXEMPTION',
      targetEntityId: 'EX_001',
      reason: 'Special university launch promotion partner',
    });

    const res = await request(app)
      .get(`/api/v1/admin/audit-logs/${record._id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.action).toBe('SELLER_EXEMPTION_GRANTED');
    expect(res.body.data.reason).toBe('Special university launch promotion partner');
  });
});
