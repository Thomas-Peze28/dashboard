import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';

describe('OAuth GitHub Integration Tests', () => {
	const testEmail = `oauth_github_test_${Date.now()}@epitech.eu`;
	const githubUserId = 100000 + Math.floor(Math.random() * 900000);

	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterAll(async () => {
		await prisma.user.deleteMany({
			where: { email: { contains: 'oauth_github_test_' } },
		});
		await prisma.$disconnect();
	});

	describe('GET /api/auth/github', () => {
		it('devrait rediriger vers l\'URL de consentement GitHub (302)', async () => {
			const res = await request(app).get('/api/auth/github');

			expect(res.status).toBe(302);
			expect(res.headers.location).toContain('https://github.com/login/oauth/authorize');
			expect(res.headers.location).toContain('scope=read%3Auser+user%3Aemail');
		});
	});

	describe('GET /api/auth/github/callback', () => {
		it('devrait rediriger vers le login en cas de code manquant', async () => {
			const res = await request(app).get('/api/auth/github/callback');

			expect(res.status).toBe(302);
			expect(res.headers.location).toContain('/login?error=missing_code');
		});

		it('devrait créer l\'utilisateur, lier le compte et renvoyer un JWT sur succès', async () => {
			const fetchSpy = vi.spyOn(globalThis, 'fetch');

			fetchSpy.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					access_token: 'fake_github_access_token',
					token_type: 'bearer',
					scope: 'read:user,user:email',
				}),
			} as Response);

			fetchSpy.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					id: githubUserId,
					login: 'oauth-test-user',
					name: 'OAuth GitHub Test User',
					email: testEmail,
				}),
			} as Response);

			const res = await request(app).get('/api/auth/github/callback?code=valid_fake_code');

			expect(res.status).toBe(302);
			expect(res.headers.location).toContain('/auth/callback?token=');

			const user = await prisma.user.findUnique({
				where: { email: testEmail },
				include: { accounts: true },
			});

			expect(user).not.toBeNull();
			expect(user?.isVerified).toBe(true);
			expect(user?.accounts).toHaveLength(1);
			expect(user?.accounts[0]?.provider).toBe('github');
			expect(user?.accounts[0]?.providerAccountId).toBe(String(githubUserId));
			expect(user?.accounts[0]?.accessToken).toBe('fake_github_access_token');
		});

		it('devrait rediriger vers /login?error=oauth_failed en cas d\'erreur de l\'API GitHub', async () => {
			const fetchSpy = vi.spyOn(globalThis, 'fetch');

			fetchSpy.mockResolvedValueOnce({
				ok: false,
				status: 400,
				json: async () => ({ error: 'bad_verification_code' }),
			} as Response);

			const res = await request(app).get('/api/auth/github/callback?code=bad_code');

			expect(res.status).toBe(302);
			expect(res.headers.location).toContain('/login?error=oauth_failed');
		});
	});
});
