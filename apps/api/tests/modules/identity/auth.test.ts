import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../../../src/app.js';
import { User } from '../../../src/modules/identity/models/user.model.js';

describe('MOD-01 Authentication & User Management Tests', () => {
  const app = createApp();
  const testDbUri = 'mongodb://localhost:27017/autodock_test_identity_auth';

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(testDbUri);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('Registers a new customer successfully with hashed password and Sri Lankan phone', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'kamal.perera@example.com',
        password: 'Password@123',
        firstName: 'Kamal',
        lastName: 'Perera',
        phone: '+94771234567',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.code).toBe('USER_REGISTERED');
    expect(res.body.data.email).toBe('kamal.perera@example.com');
    expect(res.body.data.role).toBe('CUSTOMER');

    // Verify in database that password was hashed with bcrypt
    const savedUser = await User.findOne({ email: 'kamal.perera@example.com' }).select('+passwordHash');
    expect(savedUser).toBeDefined();
    expect(savedUser?.passwordHash).not.toBe('Password@123');
    expect(savedUser?.passwordHash.startsWith('$2')).toBe(true);
  });

  it('Rejects duplicate email registration with 409 Conflict', async () => {
    await request(app).post('/api/v1/auth/register').send({
      email: 'kamal.perera@example.com',
      password: 'Password@123',
      firstName: 'Kamal',
      lastName: 'Perera',
      phone: '+94771234567',
    });

    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'kamal.perera@example.com',
      password: 'AnotherPassword@456',
      firstName: 'Kamal',
      lastName: 'Perera',
      phone: '+94771234567',
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('RESOURCE_CONFLICT');
  });

  it('Rejects registration with invalid password complexity or invalid Sri Lankan phone format', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'invalid@example.com',
      password: 'weak',
      firstName: 'A',
      lastName: 'B',
      phone: '0771234567', // Not E.164 +94
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('Authenticates valid user and returns JWT access token + secure refresh cookie', async () => {
    await request(app).post('/api/v1/auth/register').send({
      email: 'login.test@example.com',
      password: 'Password@123',
      firstName: 'Nimal',
      lastName: 'Fernando',
      phone: '+94719876543',
    });

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'login.test@example.com',
      password: 'Password@123',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.tokenType).toBe('Bearer');
    expect(res.body.data.user.email).toBe('login.test@example.com');

    // Verify Set-Cookie header contains refreshToken with HttpOnly and SameSite=Strict
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const refreshCookie = (cookies as unknown as string[]).find((c) => c.startsWith('refreshToken='));
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain('HttpOnly');
    expect(refreshCookie).toContain('SameSite=Strict');
  });

  it('Rejects login with invalid credentials using generic error message without user enumeration', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'nonexistent@example.com',
      password: 'RandomPassword@123',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('Protects /users/me endpoint: requires valid JWT bearer token', async () => {
    // Attempt without token
    const unauthRes = await request(app).get('/api/v1/users/me');
    expect(unauthRes.status).toBe(401);

    // Register and login
    const regRes = await request(app).post('/api/v1/auth/register').send({
      email: 'me.test@example.com',
      password: 'Password@123',
      firstName: 'Saman',
      lastName: 'Silva',
      phone: '+94761234567',
    });
    expect(regRes.status).toBe(201);

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'me.test@example.com',
      password: 'Password@123',
    });
    const token = loginRes.body.data.accessToken;

    // Access with token
    const authRes = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(authRes.status).toBe(200);
    expect(authRes.body.data.email).toBe('me.test@example.com');
    expect(authRes.body.data.firstName).toBe('Saman');
    // Ensure password hash is never leaked
    expect(authRes.body.data.passwordHash).toBeUndefined();
  });

  it('Prevents privilege escalation: updating profile does NOT allow role modification', async () => {
    await request(app).post('/api/v1/auth/register').send({
      email: 'escalate.test@example.com',
      password: 'Password@123',
      firstName: 'Normal',
      lastName: 'User',
      phone: '+94771112233',
    });

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'escalate.test@example.com',
      password: 'Password@123',
    });
    const token = loginRes.body.data.accessToken;

    // Attempt to escalate role to ADMIN
    const updateRes = await request(app)
      .put('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'UpdatedName',
        role: 'ADMIN', // malicious property
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.firstName).toBe('UpdatedName');
    expect(updateRes.body.data.role).toBe('CUSTOMER');

    // Confirm in database that role was not escalated
    const dbUser = await User.findOne({ email: 'escalate.test@example.com' });
    expect(dbUser?.role).toBe('CUSTOMER');
  });
});
