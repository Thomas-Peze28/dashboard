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

const NOTIFICATIONS = [
    {
        id: '1001',
        reason: 'review_requested',
        updated_at: '2026-10-08T08:00:00Z',
        subject: {
            title: 'Add weather widgets',
            type: 'PullRequest',
            url: 'https://api.github.com/repos/epitech/dashboard/pulls/42',
        },
        repository: { full_name: 'epitech/dashboard', html_url: 'https://github.com/epitech/dashboard' },
    },
    {
        id: '1002',
        reason: 'mention',
        updated_at: '2026-10-08T07:30:00Z',
        subject: {
            title: 'Refresh interval is ignored',
            type: 'Issue',
            url: 'https://api.github.com/repos/epitech/dashboard/issues/7',
        },
        repository: { full_name: 'epitech/dashboard', html_url: 'https://github.com/epitech/dashboard' },
    },
    {
        id: '1003',
        reason: 'subscribed',
        updated_at: '2026-10-07T18:00:00Z',
        subject: {
            title: 'v2.0.0',
            type: 'Release',
            url: 'https://api.github.com/repos/epitech/dashboard/releases/123456',
        },
        repository: { full_name: 'epitech/dashboard', html_url: 'https://github.com/epitech/dashboard' },
    },
];

const PROFILE_TORVALDS = {
    login: 'torvalds',
    name: 'Linus Torvalds',
    type: 'User',
    avatar_url: 'https://avatars.githubusercontent.com/u/1024025?v=4',
    html_url: 'https://github.com/torvalds',
    bio: null,
    company: 'Linux Foundation',
    location: 'Portland, OR',
    public_repos: 8,
    followers: 240000,
    following: 0,
    created_at: '2011-09-03T15:26:22Z',
};

/**
* Stubs global fetch with a single GitHub API response.
**/
const mockGithub = (body: unknown, status = 200, headers: Record<string, string> = {}) => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...headers },
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
    let profileWidgetId = '';
    let notificationsWidgetId = '';

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

    /**
    * Points the github_profile widget to another username.
    **/
    const setUsername = (username: unknown) => request(app)
        .patch(`/api/widgets/${profileWidgetId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ config: { username } });

    const getProfileData = () => request(app)
        .get(`/api/widgets/${profileWidgetId}/data`)
        .set('Authorization', `Bearer ${token}`);

    /**
    * Changes the number of notifications of the github_notifications widget.
    **/
    const setLimit = (limit: unknown) => request(app)
        .patch(`/api/widgets/${notificationsWidgetId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ config: { limit } });

    const getNotificationsData = () => request(app)
        .get(`/api/widgets/${notificationsWidgetId}/data`)
        .set('Authorization', `Bearer ${token}`);

    beforeAll(async () => {
        const repoWidget = await ensureGithubWidget('github_repo');
        const profileWidget = await ensureGithubWidget('github_profile');
        const notificationsWidget = await ensureGithubWidget('github_notifications');

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

        const profileRes = await request(app)
            .post('/api/widgets')
            .set('Authorization', `Bearer ${token}`)
            .send({ widgetId: profileWidget.id, config: { username: 'torvalds' } });
        profileWidgetId = profileRes.body.widget.id;

        const notificationsRes = await request(app)
            .post('/api/widgets')
            .set('Authorization', `Bearer ${token}`)
            .send({ widgetId: notificationsWidget.id, config: { limit: 5 } });
        notificationsWidgetId = notificationsRes.body.widget.id;
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
    });

    describe('github_profile', () => {

        it('devrait renvoyer le profil demandé', async () => {
            await setUsername('torvalds');
            const fetchMock = mockGithub(PROFILE_TORVALDS);

            const res = await getProfileData();

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual({
                login: 'torvalds',
                name: 'Linus Torvalds',
                type: 'User',
                avatarUrl: 'https://avatars.githubusercontent.com/u/1024025?v=4',
                url: 'https://github.com/torvalds',
                bio: null,
                company: 'Linux Foundation',
                location: 'Portland, OR',
                publicRepos: 8,
                followers: 240000,
                following: 0,
                createdAt: '2011-09-03T15:26:22Z',
            });

            const [url] = fetchMock.mock.calls[0] as unknown as [string];
            expect(url).toBe('https://api.github.com/users/torvalds');
        });

        it.each(['', '   ', undefined])('devrait renvoyer le profil de l\'utilisateur connecté si username vaut %j', async (username) => {
            await setUsername(username);
            const fetchMock = mockGithub(PROFILE_TORVALDS);

            const res = await getProfileData();

            expect(res.status).toBe(200);
            const [url] = fetchMock.mock.calls[0] as unknown as [string];
            expect(url).toBe('https://api.github.com/user');
        });

        it.each(['-torvalds', 'tor valds', 'torvalds/linux', 42])('400 si username vaut %j', async (username) => {
            await setUsername(username);
            const fetchMock = mockGithub(PROFILE_TORVALDS);

            const res = await getProfileData();

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Invalid widget configuration.');
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('400 si l\'utilisateur GitHub n\'existe pas', async () => {
            await setUsername('this-user-does-not-exist-42');
            mockGithub({ message: 'Not Found' }, 404);

            const res = await getProfileData();

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('GitHub resource not found.');
        });
    });

    describe('github_notifications', () => {

        it('devrait renvoyer les notifications non lues avec un lien vers la page GitHub', async () => {
            await setLimit(5);
            const fetchMock = mockGithub(NOTIFICATIONS);

            const res = await getNotificationsData();

            expect(res.status).toBe(200);
            expect(res.body.data.count).toBe(3);
            expect(res.body.data.notifications[0]).toEqual({
                id: '1001',
                title: 'Add weather widgets',
                type: 'PullRequest',
                reason: 'review_requested',
                repository: 'epitech/dashboard',
                url: 'https://github.com/epitech/dashboard/pull/42',
                updatedAt: '2026-10-08T08:00:00Z',
            });
            expect(res.body.data.notifications[1].url).toBe('https://github.com/epitech/dashboard/issues/7');
            expect(res.body.data.notifications[2].url).toBe('https://github.com/epitech/dashboard');

            const [url] = fetchMock.mock.calls[0] as unknown as [string];
            expect(url).toBe('https://api.github.com/notifications?per_page=5');
        });

        it('devrait renvoyer une liste vide s\'il n\'y a aucune notification', async () => {
            mockGithub([]);

            const res = await getNotificationsData();

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual({ count: 0, notifications: [] });
        });

        it.each([
            [100, '50'],
            [0, '1'],
            ['abc', '10'],
            [undefined, '10'],
        ])('limit = %j devrait demander per_page=%s', async (limit, perPage) => {
            await setLimit(limit);
            const fetchMock = mockGithub([]);

            await getNotificationsData();

            const [url] = fetchMock.mock.calls[0] as unknown as [string];
            expect(new URL(url).searchParams.get('per_page')).toBe(perPage);
        });

        it('403 si le token n\'a pas les permissions nécessaires', async () => {
            mockGithub({ message: 'Resource not accessible by integration' }, 403, { 'x-ratelimit-remaining': '4999' });

            const res = await getNotificationsData();

            expect(res.status).toBe(403);
            expect(res.body.error).toBe('Missing GitHub permissions. Please sign in with GitHub again.');
        });

        it('429 si la limite de requêtes GitHub est atteinte', async () => {
            mockGithub({ message: 'API rate limit exceeded' }, 403, { 'x-ratelimit-remaining': '0' });

            const res = await getNotificationsData();

            expect(res.status).toBe(429);
            expect(res.body.error).toBe('GitHub rate limit reached. Please try again later.');
        });
    });

    describe('compte GitHub non lié', () => {

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
