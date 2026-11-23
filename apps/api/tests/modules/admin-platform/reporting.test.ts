import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../../../src/app.js';
import { env } from '../../../src/config/env.js';
import { reportingService } from '../../../src/modules/admin-platform/services/reporting.service.js';
import { AuditEvent } from '../../../src/modules/admin-platform/models/auditEvent.model.js';

describe('MOD-05 Consolidated Reporting & Dashboard Tests', () => {
  const app = createApp();
  const testDbUri = 'mongodb://localhost:27017/autodock_test_mod05_reporting';

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
    if (mongoose.connection.db) {
      await mongoose.connection.db.collection('audit_events').deleteMany({});
    }
  });

  it('TC-REP-01: Admin retrieves dashboard summary; Master Orders and Suborders remain distinct', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard/summary')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.overview).toBeDefined();

    // Verify distinct counters are tracked separately
    expect(res.body.data.overview).toHaveProperty('totalMasterOrders');
    expect(res.body.data.overview).toHaveProperty('totalMerchantSuborders');
    expect(res.body.data.overview).toHaveProperty('grossMerchandiseValueInCents');
    expect(res.body.data.overview).toHaveProperty('logisticsRevenueInCents');
    expect(res.body.data.overview).toHaveProperty('accruedCommissionInCents');
    expect(res.body.data.overview).toHaveProperty('platformSubsidyLiabilityInCents');

    // Freshness & Module health
    expect(res.body.data.systemFreshness).toBeDefined();
    expect(res.body.data.systemFreshness.moduleHealth.MOD_05).toBe('ONLINE');
  });

  it('TC-REP-02: Non-admin users are forbidden from accessing dashboard metrics (403 Forbidden)', async () => {
    await request(app)
      .get('/api/v1/admin/dashboard/summary')
      .set('Authorization', `Bearer ${tokenCustomer}`)
      .expect(403);
  });

  it('TC-REP-03: In-memory cache returns cached data within TTL window', async () => {
    const firstCall = await reportingService.getDashboardSummary();
    const secondCall = await reportingService.getDashboardSummary();

    expect(firstCall.systemFreshness.cachedAt).toBe(secondCall.systemFreshness.cachedAt);
  });

  it('TC-REP-04: Dynamic report query with CSV export applies PII masking and logs audit record', async () => {
    // Seed an audit log with email
    await AuditEvent.create({
      action: 'TEST_ACTION',
      sourceModule: 'MOD-01',
      severity: 'LOW',
      actor: { actorId: adminId, actorRole: 'ADMIN', email: 'officer.smith@autodock.lk' },
      targetEntity: { entityType: 'TEST', entityId: '001' },
      reason: 'Call customer at +94 77 123 4567 regarding verification',
      timestamp: new Date(),
    });

    const res = await request(app)
      .get('/api/v1/admin/reports/audit-activity?format=csv')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    expect(res.headers['content-type']).toContain('text/csv');
    const csvContent = res.text;

    // Check PII masking
    expect(csvContent).toContain('+94 77 **** 4567');
    expect(csvContent).not.toContain('+94 77 123 4567');

    // Verify self-auditing: REPORT_EXPORTED was logged
    const exportAudits = await AuditEvent.find({ action: 'REPORT_EXPORTED' });
    expect(exportAudits.length).toBeGreaterThanOrEqual(1);
  });
});
