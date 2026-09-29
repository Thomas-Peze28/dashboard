import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';

describe('OAuth Google Integration Tests', () => {
  const testEmail = `oauth_test_${Date.now()}@epitech.eu`;
  const googleSubId = `google_sub_${Date.now()}`;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    // Nettoyage en base des comptes créés pendant les tests
    await prisma.user.deleteMany({
      where: { email: { contains: 'oauth_test_' } },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/auth/google', () => {
    it('devrait rediriger vers l\'URL de consentement Google (302)', async () => {
      const res = await request(app).get('/api/auth/google');

      expect(res.status).toBe(302);
      expect(res.headers.location).toBeDefined();
      expect(res.headers.location).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(res.headers.location).toContain('response_type=code');
      expect(res.headers.location).toContain('scope=');
    });
  });

  describe('GET /api/auth/google/callback', () => {
    it('devrait rediriger vers le login en cas de code manquant', async () => {
      const res = await request(app).get('/api/auth/google/callback');

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('/login?error=missing_code');
    });

    it('devrait créer l\'utilisateur, lier le compte et renvoyer un JWT sur succès', async () => {
      // Mock des réponses de l'API Google
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      // 1er appel fetch : échange du code contre les tokens
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'fake_google_access_token',
          refresh_token: 'fake_google_refresh_token',
          expires_in: 3600,
        }),
      } as Response);

      // 2e appel fetch : récupération du profil Google
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: googleSubId,
          email: testEmail,
          name: 'OAuth Test User',
        }),
      } as Response);

      const res = await request(app).get('/api/auth/google/callback?code=valid_fake_code');

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('/auth/callback?token=');

      // Vérification en base de données
      const user = await prisma.user.findUnique({
        where: { email: testEmail },
        include: { accounts: true },
      });

      expect(user).not.toBeNull();
      expect(user?.email).toBe(testEmail);
      expect(user?.isVerified).toBe(true);
      expect(user?.accounts).toHaveLength(1);
      expect(user?.accounts[0].provider).toBe('google');
      expect(user?.accounts[0].providerAccountId).toBe(googleSubId);
      expect(user?.accounts[0].accessToken).toBe('fake_google_access_token');
    });

    it('devrait lier le compte Google si l\'utilisateur existe déjà avec cet email', async () => {
      const existingEmail = `oauth_existing_${Date.now()}@epitech.eu`;
      const secondGoogleId = `google_sub_2_${Date.now()}`;

      // Création préalable d'un utilisateur sans compte OAuth
      await prisma.user.create({
        data: {
          email: existingEmail,
          name: 'Existing User',
          password: 'Password1234!',
          isVerified: true,
        },
      });

      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'token_2',
          expires_in: 3600,
        }),
      } as Response);

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: secondGoogleId,
          email: existingEmail,
          name: 'Existing User Updated',
        }),
      } as Response);

      const res = await request(app).get('/api/auth/google/callback?code=another_fake_code');

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('/auth/callback?token=');

      // Vérifie que le compte existant a bien reçu la liaison Account
      const user = await prisma.user.findUnique({
        where: { email: existingEmail },
        include: { accounts: true },
      });

      expect(user?.accounts).toHaveLength(1);
      expect(user?.accounts[0].provider).toBe('google');
      expect(user?.accounts[0].providerAccountId).toBe(secondGoogleId);

      // Nettoyage de l'utilisateur créé
      await prisma.user.delete({ where: { email: existingEmail } });
    });

    it('devrait rediriger vers /login?error=oauth_failed en cas d\'erreur de l\'API Google', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      // Simule un échec lors de l'échange de token (ex: code invalide ou expiré)
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'invalid_grant' }),
      } as Response);

      const res = await request(app).get('/api/auth/google/callback?code=bad_code');

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('/login?error=oauth_failed');
    });
  });
});