import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';

describe('Auth & User Integration Tests', () => {
  const testUser = {
    email: `ci_test_${Date.now()}@epitech.eu`,
    password: 'Password1234!',
    name: 'CI Tester',
  };

  let verificationToken: string | null = null;
  let jwtToken = '';

  afterAll(async () => {
    // Clean up the test user from the database
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should reject registration if the password is fewer than 8 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'short@epitech.eu', password: '123' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should successfully create a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe(testUser.email);

      // Retrieve the token generated in the database for the confirmation test
      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
      });
      verificationToken = user?.verificationToken ?? null;
      expect(verificationToken).toBeTruthy();
    });

    it('should return a 409 status if the account already exists', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(409);
    });
  });

  describe('GET /api/auth/confirm/:token', () => {
    it('should reject an invalid token with a 400 status', async () => {
      const res = await request(app).get('/api/auth/confirm/invalid-token-1234');
      expect(res.status).toBe(400);
    });

    it('should validate the account with a valid token', async () => {
      const res = await request(app).get(`/api/auth/confirm/${verificationToken}`);
      expect(res.status).toBe(200);

      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
      });
      expect(user?.isVerified).toBe(true);
      expect(user?.verificationToken).toBeNull();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should reject login with an incorrect password (401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'WrongPassword' });

      expect(res.status).toBe(401);
    });

    it('should log in the user and return a JWT (200)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      jwtToken = res.body.token;
    });
  });

  describe('GET /api/users/me (requireAuth)', () => {
    it('should reject access without an Authorization header (401)', async () => {
      const res = await request(app).get('/api/users/me');
      expect(res.status).toBe(401);
    });

    it('should reject access with an invalid token (401)', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer token_bidon');

      expect(res.status).toBe(401);
    });

    it('should return the user profile with a valid token (200)', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(testUser.email);
    });
  });
});