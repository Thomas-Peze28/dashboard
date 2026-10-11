import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { createOAuthState } from '../services/oauth/oauthState.js';

// State valide d'une simple connexion (sans utilisateur à relier).
const signInState = () => encodeURIComponent(createOAuthState());

/**
* Simule les réponses de GitHub : échange du code, puis profil de l'utilisateur.
**/
const mockGithub = (id: number, email: string, accessToken: string) => {
	const fetchSpy = vi.spyOn(globalThis, 'fetch');
	fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: accessToken }) } as Response);
	fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({ id, login: `user-${id}`, name: null, email }) } as Response);
	return fetchSpy;
};

/**
* Crée un utilisateur confirmé et renvoie son identifiant et son JWT.
**/
const createUser = async (email: string) => {
	const registerRes = await request(app).post('/api/auth/register').send({ email, password: 'Password1234!' });
	await prisma.user.update({ where: { id: registerRes.body.user.id }, data: { isVerified: true } });
	const loginRes = await request(app).post('/api/auth/login').send({ email, password: 'Password1234!' });
	return { id: registerRes.body.user.id as string, token: loginRes.body.token as string };
};

/**
* Lit l'identifiant d'utilisateur contenu dans le JWT renvoyé au frontend.
**/
const userIdFromRedirect = (location: string) => {
	const token = new URL(location).searchParams.get('token') ?? '';
	return JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString()).userId as string;
};

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
			expect(res.headers.location).toContain('scope=read%3Auser+user%3Aemail+repo');
			expect(new URL(res.headers.location ?? '').searchParams.get('state')).toBeTruthy();
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

			const res = await request(app).get(`/api/auth/github/callback?code=valid_fake_code&state=${signInState()}`);

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

		it('devrait mettre à jour le token du compte existant lors d\'une reconnexion', async () => {
			const fetchSpy = vi.spyOn(globalThis, 'fetch');

			fetchSpy.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					access_token: 'new_fake_github_access_token',
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

			const res = await request(app).get(`/api/auth/github/callback?code=second_fake_code&state=${signInState()}`);

			expect(res.status).toBe(302);

			const user = await prisma.user.findUnique({
				where: { email: testEmail },
				include: { accounts: true },
			});

			expect(user?.accounts).toHaveLength(1);
			expect(user?.accounts[0]?.accessToken).toBe('new_fake_github_access_token');
		});

		it('devrait rediriger vers /login?error=oauth_failed en cas d\'erreur de l\'API GitHub', async () => {
			const fetchSpy = vi.spyOn(globalThis, 'fetch');

			fetchSpy.mockResolvedValueOnce({
				ok: false,
				status: 400,
				json: async () => ({ error: 'bad_verification_code' }),
			} as Response);

			const res = await request(app).get(`/api/auth/github/callback?code=bad_code&state=${signInState()}`);

			expect(res.status).toBe(302);
			expect(res.headers.location).toContain('/login?error=oauth_failed');
		});

		it('devrait refuser un callback sans state ou avec un state falsifié', async () => {
			const fetchSpy = vi.spyOn(globalThis, 'fetch');

			for (const state of ['', '&state=faux', `&state=${signInState()}x`]) {
				const res = await request(app).get(`/api/auth/github/callback?code=some_code${state}`);

				expect(res.status).toBe(302);
				expect(res.headers.location).toContain('/login?error=oauth_failed');
			}
			expect(fetchSpy).not.toHaveBeenCalled();
		});
	});

	describe('Liaison à l\'utilisateur connecté', () => {
		const linkedGithubId = 100000 + Math.floor(Math.random() * 900000);

		it('POST /api/auth/github/link - 401 sans être connecté', async () => {
			const res = await request(app).post('/api/auth/github/link');

			expect(res.status).toBe(401);
		});

		it('devrait relier le compte GitHub à l\'utilisateur connecté, même avec un autre e-mail', async () => {
			const owner = await createUser(`oauth_github_test_owner_${Date.now()}@epitech.eu`);
			const githubEmail = `oauth_github_test_other_${Date.now()}@gmail.com`;

			const linkRes = await request(app).post('/api/auth/github/link').set('Authorization', `Bearer ${owner.token}`);
			expect(linkRes.status).toBe(200);

			const state = new URL(linkRes.body.url).searchParams.get('state') ?? '';
			mockGithub(linkedGithubId, githubEmail, 'linked_token');

			const res = await request(app).get(`/api/auth/github/callback?code=link_code&state=${encodeURIComponent(state)}`);

			expect(res.status).toBe(302);
			expect(res.headers.location).toMatch(/\/dashboard$/);

			const account = await prisma.account.findFirst({ where: { provider: 'github', providerAccountId: String(linkedGithubId) } });
			expect(account?.userId).toBe(owner.id);
			expect(await prisma.user.findUnique({ where: { email: githubEmail } })).toBeNull();

			// Une connexion GitHub ultérieure ouvre la session de ce même utilisateur.
			mockGithub(linkedGithubId, githubEmail, 'login_token');
			const loginRes = await request(app).get(`/api/auth/github/callback?code=login_code&state=${signInState()}`);

			expect(loginRes.headers.location).toContain('/auth/callback?token=');
			expect(userIdFromRedirect(loginRes.headers.location ?? '')).toBe(owner.id);
		});

		it('devrait refuser de relier un compte GitHub déjà relié à un autre utilisateur', async () => {
			const intruder = await createUser(`oauth_github_test_intruder_${Date.now()}@epitech.eu`);

			const linkRes = await request(app).post('/api/auth/github/link').set('Authorization', `Bearer ${intruder.token}`);
			const state = new URL(linkRes.body.url).searchParams.get('state') ?? '';
			mockGithub(linkedGithubId, 'peu.importe@gmail.com', 'stolen_token');

			const res = await request(app).get(`/api/auth/github/callback?code=steal_code&state=${encodeURIComponent(state)}`);

			expect(res.headers.location).toContain('/dashboard?error=account_already_linked');
			expect(await prisma.account.count({ where: { userId: intruder.id } })).toBe(0);
		});
	});
});
