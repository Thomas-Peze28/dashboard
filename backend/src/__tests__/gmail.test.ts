import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';

const GOOGLE_TOKEN = 'fake_google_widget_token';
const REFRESHED_TOKEN = 'fake_google_refreshed_token';
const REFRESH_TOKEN = 'fake_google_refresh_token';

const MESSAGE_LIST = {
    messages: [
        { id: 'msg1', threadId: 'thread1' },
        { id: 'msg2', threadId: 'thread2' },
        { id: 'msg3', threadId: 'thread3' },
    ],
};

const MESSAGES: Record<string, unknown> = {
    msg1: {
        id: 'msg1',
        threadId: 'thread1',
        labelIds: ['INBOX', 'UNREAD'],
        internalDate: '1791533700000',
        payload: {
            headers: [
                { name: 'From', value: '"Doe, Jane" <jane@example.com>' },
                { name: 'Subject', value: 'Weekly meeting' },
            ],
        },
    },
    msg2: {
        id: 'msg2',
        threadId: 'thread2',
        labelIds: ['INBOX'],
        internalDate: '1791530100000',
        payload: {
            headers: [
                { name: 'from', value: 'noreply@github.com' },
                { name: 'subject', value: '[epitech/dashboard] PR #42 merged' },
            ],
        },
    },
    msg3: {
        id: 'msg3',
        threadId: 'thread3',
        labelIds: ['INBOX'],
        internalDate: '1791526500000',
        payload: {
            headers: [
                { name: 'From', value: 'John Smith <john@example.com>' },
            ],
        },
    },
};

const jsonResponse = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/**
* Stubs global fetch with fake Google APIs: the token endpoint, the INBOX label, the message list and each message.
**/
const mockGoogle = (options: { status?: number; refreshStatus?: number; unread?: number; list?: unknown } = {}) => {
    const fetchMock = vi.fn(async (input: string | URL | Request, _init?: RequestInit) => {
        const url = input instanceof Request ? input.url : input.toString();

        if (url.startsWith('https://oauth2.googleapis.com/token')) {
            return options.refreshStatus
                ? jsonResponse({ error: 'invalid_grant' }, options.refreshStatus)
                : jsonResponse({ access_token: REFRESHED_TOKEN, expires_in: 3599 });
        }
        if (options.status) {
            return jsonResponse({ error: { code: options.status } }, options.status);
        }
        if (url.includes('/labels/INBOX')) {
            return jsonResponse(options.unread === undefined ? { id: 'INBOX' } : { id: 'INBOX', messagesUnread: options.unread });
        }

        const messageId = url.match(/\/messages\/([^?]+)/)?.[1];
        return jsonResponse(messageId ? MESSAGES[messageId] : options.list ?? MESSAGE_LIST);
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
};

/**
* Returns the Authorization header sent with a fetch call.
**/
const getAuthorization = (call: unknown[] | undefined) => {
    const init = call?.[1] as RequestInit | undefined;
    return (init?.headers as Record<string, string> | undefined)?.Authorization;
};

/**
* Returns the catalog widget with the given name, creating the gmail service entry if the database is not seeded.
**/
const ensureGmailWidget = async (name: string) => {
    const service = await prisma.service.upsert({
        where: { name: 'gmail' },
        update: {},
        create: { name: 'gmail', description: 'Gmail service for tests' },
    });

    const existing = await prisma.widget.findFirst({ where: { serviceId: service.id, name } });
    return existing ?? prisma.widget.create({ data: { serviceId: service.id, name, description: name } });
};

describe('Gmail widgets Integration Tests', () => {

    let token = '';
    let userId = '';
    let unreadWidgetId = '';
    let threadsWidgetId = '';

    /**
    * Stores the Google account of the user, with a token expiring in `expiresIn` seconds.
    **/
    const linkGoogleAccount = async (expiresIn: number, refreshToken: string | null = REFRESH_TOKEN) => {
        await prisma.account.deleteMany({ where: { userId, provider: 'google' } });
        await prisma.account.create({
            data: {
                userId,
                provider: 'google',
                providerAccountId: `google_test_${Date.now()}`,
                accessToken: GOOGLE_TOKEN,
                refreshToken,
                expiresAt: Math.floor(Date.now() / 1000) + expiresIn,
            },
        });
    };

    const getUnreadData = () => request(app)
        .get(`/api/widgets/${unreadWidgetId}/data`)
        .set('Authorization', `Bearer ${token}`);

    const getThreadsData = () => request(app)
        .get(`/api/widgets/${threadsWidgetId}/data`)
        .set('Authorization', `Bearer ${token}`);

    /**
    * Changes the number of e-mails of the gmail_recent_threads widget.
    **/
    const setLimit = (limit: unknown) => request(app)
        .patch(`/api/widgets/${threadsWidgetId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ config: { limit } });

    beforeAll(async () => {
        const unreadWidget = await ensureGmailWidget('gmail_unread_count');
        const threadsWidget = await ensureGmailWidget('gmail_recent_threads');

        const authRes = await request(app)
            .post('/api/auth/register')
            .send({ email: `gmail_test_${Date.now()}@epitech.eu`, password: 'Password1234!' });
        userId = authRes.body.user.id;

        await prisma.user.update({
            where: { id: userId },
            data: { isVerified: true },
        });

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: authRes.body.user.email, password: 'Password1234!' });
        token = loginRes.body.token;

        const unreadRes = await request(app)
            .post('/api/widgets')
            .set('Authorization', `Bearer ${token}`)
            .send({ widgetId: unreadWidget.id, config: {} });
        unreadWidgetId = unreadRes.body.widget.id;

        const threadsRes = await request(app)
            .post('/api/widgets')
            .set('Authorization', `Bearer ${token}`)
            .send({ widgetId: threadsWidget.id, config: { limit: 3 } });
        threadsWidgetId = threadsRes.body.widget.id;
    });

    beforeEach(async () => {
        await linkGoogleAccount(3600);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    afterAll(async () => {
        await prisma.user.deleteMany({
            where: { email: { contains: 'gmail_test_' } },
        });
        await prisma.$disconnect();
    });

    describe('gmail_unread_count', () => {

        it('devrait renvoyer le nombre de messages non lus de la boîte de réception', async () => {
            const fetchMock = mockGoogle({ unread: 12 });

            const res = await getUnreadData();

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual({ unread: 12 });
            expect(String(fetchMock.mock.calls[0]?.[0])).toBe('https://gmail.googleapis.com/gmail/v1/users/me/labels/INBOX');
            expect(getAuthorization(fetchMock.mock.calls[0])).toBe(`Bearer ${GOOGLE_TOKEN}`);
        });

        it('devrait renvoyer 0 si Gmail n\'indique aucun message non lu', async () => {
            mockGoogle();

            const res = await getUnreadData();

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual({ unread: 0 });
        });
    });

    describe('gmail_recent_threads', () => {

        it('devrait renvoyer les expéditeurs et objets des derniers e-mails', async () => {
            const fetchMock = mockGoogle();

            const res = await getThreadsData();

            expect(res.status).toBe(200);
            expect(res.body.data.count).toBe(3);
            expect(res.body.data.emails[0]).toEqual({
                id: 'msg1',
                from: 'Doe, Jane',
                fromEmail: 'jane@example.com',
                subject: 'Weekly meeting',
                date: new Date(1791533700000).toISOString(),
                unread: true,
                url: 'https://mail.google.com/mail/u/0/#inbox/thread1',
            });
            expect(res.body.data.emails[1]).toMatchObject({
                from: 'noreply@github.com',
                fromEmail: 'noreply@github.com',
                subject: '[epitech/dashboard] PR #42 merged',
                unread: false,
            });
            expect(res.body.data.emails[2]).toMatchObject({ from: 'John Smith', subject: '' });

            const listUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
            expect(listUrl.searchParams.get('labelIds')).toBe('INBOX');
            expect(listUrl.searchParams.get('maxResults')).toBe('3');

            const messageUrl = new URL(String(fetchMock.mock.calls[1]?.[0]));
            expect(messageUrl.searchParams.get('format')).toBe('metadata');
            expect(messageUrl.searchParams.getAll('metadataHeaders')).toEqual(['From', 'Subject']);
        });

        it('devrait renvoyer une liste vide si la boîte de réception est vide', async () => {
            const fetchMock = mockGoogle({ list: { resultSizeEstimate: 0 } });

            const res = await getThreadsData();

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual({ count: 0, emails: [] });
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it.each([
            [50, '20'],
            [0, '1'],
            ['abc', '5'],
        ])('devrait borner limit=%s à maxResults=%s', async (limit, expected) => {
            await setLimit(limit);
            const fetchMock = mockGoogle({ list: {} });

            await getThreadsData();

            const listUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
            expect(listUrl.searchParams.get('maxResults')).toBe(expected);

            await setLimit(3);
        });
    });

    describe('token Google', () => {

        it('devrait rafraîchir le token expiré et l\'enregistrer', async () => {
            await linkGoogleAccount(-10);
            const fetchMock = mockGoogle({ unread: 4 });

            const res = await getUnreadData();

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual({ unread: 4 });

            const refreshInit = fetchMock.mock.calls[0]?.[1];
            expect(String(fetchMock.mock.calls[0]?.[0])).toBe('https://oauth2.googleapis.com/token');
            expect(new URLSearchParams(String(refreshInit?.body)).get('grant_type')).toBe('refresh_token');
            expect(new URLSearchParams(String(refreshInit?.body)).get('refresh_token')).toBe(REFRESH_TOKEN);
            expect(getAuthorization(fetchMock.mock.calls[1])).toBe(`Bearer ${REFRESHED_TOKEN}`);

            const account = await prisma.account.findFirst({ where: { userId, provider: 'google' } });
            expect(account?.accessToken).toBe(REFRESHED_TOKEN);
            expect(account?.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000) + 3000);
        });

        it('ne devrait pas rafraîchir un token encore valide', async () => {
            const fetchMock = mockGoogle({ unread: 1 });

            await getUnreadData();

            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it('403 si le refresh token est révoqué', async () => {
            await linkGoogleAccount(-10);
            mockGoogle({ refreshStatus: 400 });

            const res = await getUnreadData();

            expect(res.status).toBe(403);
            expect(res.body.error).toBe('Google token expired or revoked. Please sign in with Google again.');
        });

        it('403 si le token est expiré sans refresh token', async () => {
            await linkGoogleAccount(-10, null);
            const fetchMock = mockGoogle({ unread: 1 });

            const res = await getUnreadData();

            expect(res.status).toBe(403);
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('403 si le token est refusé par Gmail', async () => {
            mockGoogle({ status: 401 });

            const res = await getThreadsData();

            expect(res.status).toBe(403);
            expect(res.body.error).toContain('Google token expired or revoked');
        });
    });

    describe('erreurs', () => {

        it('403 si le scope Gmail n\'a pas été accordé', async () => {
            mockGoogle({ status: 403 });

            const res = await getUnreadData();

            expect(res.status).toBe(403);
            expect(res.body.error).toBe('Missing Google permissions. Please sign in with Google again.');
        });

        it('429 si la limite de requêtes Google est atteinte', async () => {
            mockGoogle({ status: 429 });

            const res = await getThreadsData();

            expect(res.status).toBe(429);
        });

        it('502 si Gmail est indisponible', async () => {
            mockGoogle({ status: 503 });

            const res = await getUnreadData();

            expect(res.status).toBe(502);
        });

        it('502 si le réseau est coupé', async () => {
            vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));

            const res = await getThreadsData();

            expect(res.status).toBe(502);
        });

        it('403 si l\'utilisateur n\'a pas lié de compte Google', async () => {
            await prisma.account.deleteMany({ where: { userId, provider: 'google' } });
            const fetchMock = mockGoogle({ unread: 1 });

            const res = await getUnreadData();

            expect(res.status).toBe(403);
            expect(res.body.error).toBe('No Google account linked. Please sign in with Google.');
            expect(fetchMock).not.toHaveBeenCalled();
        });
    });
});
