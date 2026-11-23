import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('AutoDock Backend Foundation Tests', () => {
  const app = createApp();

  it('GET /health returns 200 OK with safe status payload', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.code).toBe('OK');
    expect(res.body.data.status).toBe('UP');
    expect(res.body.data.environment).toBeDefined();
    expect(res.headers['x-request-id']).toBeDefined();
    // Verify no credentials or internal paths are leaked
    expect(res.body.data.mongodb_uri).toBeUndefined();
    expect(res.body.data.jwt_secret).toBeUndefined();
  });

  it('GET /api/v1/health returns 200 OK for API namespace', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.version).toBe('v1');
  });

  it('GET /unknown-route returns standard 404 error envelope', async () => {
    const res = await request(app).get('/unknown-nonexistent-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('RESOURCE_NOT_FOUND');
    expect(res.body.meta.requestId).toBeDefined();
  });

  it('Verify 5 module placeholder routes return ready status', async () => {
    const modules = ['identity', 'products', 'orders', 'finance', 'admin'];
    for (const mod of modules) {
      const res = await request(app).get(`/api/v1/${mod}/health`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('READY');
    }
  });
});
