import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';

const GITHUB_TOKEN = 'fake_github_widget_token';

const REPO_REACT = {
    full_name: 'facebook/react',
    description: 'The library for web and native user interfaces.',
    html_url: 'https://github.com/facebook/react',
    private: false,
    language: 'JavaScript',
    stargazers_count: 232000,
    forks_count: 47500,
    open_issues_count: 1020,
    subscribers_count: 6600,
    default_branch: 'main',
    pushed_at: '2026-10-08T09:12:44Z',
    owner: { login: 'facebook', avatar_url: 'https://avatars.githubusercontent.com/u/69631?v=4' },
};

/**
* Stubs global fetch with a single GitHub API response.
**/
const mockGithub = (body: unknown, status = 200) => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
};

/**
* Returns the catalog widget with the given name, creating the github service entry if the database is not seeded.
**/
const ensureGithubWidget = async (name: string) => {
    const service = await prisma.service.upsert({
        where: { name: 'github' },
        update: {},
        create: { name: 'github', description: 'GitHub service for tests' },
    });

    const existing = await prisma.widget.findFirst({ where: { serviceId: service.id, name } });
    return existing ?? prisma.widget.create({ data: { serviceId: service.id, name, description: name } });
};

describe('GitHub widgets Integration Tests', () => {

    let token = '';
    let userId = '';
    let repoWidgetId = '';

    /**
    * Points the github_repo widget to another repository.
    **/
    const setRepository = (repository: unknown) => request(app)
        .patch(`/api/widgets/${repoWidgetId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ config: { repository } });

    const getRepoData = () => request(app)
        .get(`/api/widgets/${repoWidgetId}/data`)
        .set('Authorization', `Bearer ${token}`);

    beforeAll(async () => {
        const repoWidget = await ensureGithubWidget('github_repo');

        const authRes = await request(app)
            .post('/api/auth/register')
            .send({ email: `github_test_${Date.now()}@epitech.eu`, password: 'Password1234!' });
        userId = authRes.body.user.id;

        await prisma.user.update({
            where: { id: userId },
            data: { isVerified: true },
        });

        await prisma.account.create({
            data: {
                userId,
                provider: 'github',
                providerAccountId: `github_test_${Date.now()}`,
                accessToken: GITHUB_TOKEN,
            },
        });

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: authRes.body.user.email, password: 'Password1234!' });
        token = loginRes.body.token;

        const widgetRes = await request(app)
            .post('/api/widgets')
            .set('Authorization', `Bearer ${token}`)
            .send({ widgetId: repoWidget.id, config: { repository: 'facebook/react' } });
        repoWidgetId = widgetRes.body.widget.id;
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    afterAll(async () => {
        await prisma.user.deleteMany({
            where: { email: { contains: 'github_test_' } },
        });
        await prisma.$disconnect();
    });

    describe('github_repo', () => {

        it('devrait renvoyer les statistiques du repository avec le token de l\'utilisateur', async () => {
            await setRepository('facebook/react');
            const fetchMock = mockGithub(REPO_REACT);

            const res = await getRepoData();

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual({
                repository: 'facebook/react',
                description: 'The library for web and native user interfaces.',
                url: 'https://github.com/facebook/react',
                owner: { login: 'facebook', avatarUrl: 'https://avatars.githubusercontent.com/u/69631?v=4' },
                language: 'JavaScript',
                stars: 232000,
                forks: 47500,
                openIssues: 1020,
                watchers: 6600,
                isPrivate: false,
                defaultBranch: 'main',
                pushedAt: '2026-10-08T09:12:44Z',
            });

            const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
            expect(url).toBe('https://api.github.com/repos/facebook/react');
            expect(new Headers(init.headers).get('Authorization')).toBe(`Bearer ${GITHUB_TOKEN}`);
        });

        it.each(['facebook', 'facebook/react/issues', '', 42])('400 si repository vaut %j', async (repository) => {
            await setRepository(repository);
            const fetchMock = mockGithub(REPO_REACT);

            const res = await getRepoData();

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Invalid widget configuration.');
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('400 si le repository n\'existe pas', async () => {
            await setRepository('facebook/does-not-exist');
            mockGithub({ message: 'Not Found' }, 404);

            const res = await getRepoData();

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('GitHub resource not found.');
        });

        it('403 si le token GitHub est révoqué', async () => {
            await setRepository('facebook/react');
            mockGithub({ message: 'Bad credentials' }, 401);

            const res = await getRepoData();

            expect(res.status).toBe(403);
            expect(res.body.error).toContain('sign in with GitHub again');
        });

        it('502 si GitHub est indisponible', async () => {
            await setRepository('facebook/react');
            mockGithub({ message: 'Server Error' }, 503);

            const res = await getRepoData();

            expect(res.status).toBe(502);
        });

        it('403 si l\'utilisateur n\'a pas lié de compte GitHub', async () => {
            await prisma.account.deleteMany({ where: { userId, provider: 'github' } });
            await setRepository('facebook/react');
            const fetchMock = mockGithub(REPO_REACT);

            const res = await getRepoData();

            expect(res.status).toBe(403);
            expect(res.body.error).toContain('No GitHub account linked');
            expect(fetchMock).not.toHaveBeenCalled();
        });
    });
});
