import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';

const CHARIZARD = {
    id: 'base1-4',
    name: 'Dracaufeu',
    image: 'https://assets.tcgdex.net/fr/base/base1/4',
};

const CARD_WITHOUT_IMAGE = {
    id: 'col1-63',
    name: 'Pikachu',
};

const SEARCH_RESULTS = [
    { id: 'sm3-20', localId: '20', name: 'Dracaufeu GX', image: 'https://assets.tcgdex.net/fr/sm/sm3/20' },
    { id: '2024sv-1', localId: '1', name: 'Dracaufeu' },
    { id: 'base1-4', localId: '4', name: 'Dracaufeu', image: 'https://assets.tcgdex.net/fr/base/base1/4' },
];

const jsonResponse = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/**
* Stubs global fetch: each call returns the next response of the list (the last one is repeated).
**/
const mockTcgdex = (...responses: Array<{ body: unknown; status?: number }>) => {
    let call = 0;
    const fetchMock = vi.fn(async (_input: string | URL | Request) => {
        const { body, status } = responses[Math.min(call++, responses.length - 1)]!;
        return jsonResponse(body, status);
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
};

/**
* Returns the catalog widget with the given name, creating the pokemon service entry if the database is not seeded.
**/
const ensurePokemonWidget = async (name: string) => {
    const service = await prisma.service.upsert({
        where: { name: 'pokemon' },
        update: {},
        create: { name: 'pokemon', description: 'Pokémon service for tests' },
    });

    const existing = await prisma.widget.findFirst({ where: { serviceId: service.id, name } });
    return existing ?? prisma.widget.create({ data: { serviceId: service.id, name, description: name } });
};

describe('Pokémon widgets Integration Tests', () => {

    let token = '';
    let randomWidgetId = '';
    let cardWidgetId = '';

    beforeAll(async () => {
        const random = await ensurePokemonWidget('pokemon_random_card');
        const card = await ensurePokemonWidget('pokemon_card');

        const authRes = await request(app)
            .post('/api/auth/register')
            .send({ email: `pokemon_test_${Date.now()}@epitech.eu`, password: 'Password1234!' });

        await prisma.user.update({
            where: { id: authRes.body.user.id },
            data: { isVerified: true },
        });

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: authRes.body.user.email, password: 'Password1234!' });

        token = loginRes.body.token;

        const randomRes = await request(app)
            .post('/api/widgets')
            .set('Authorization', `Bearer ${token}`)
            .send({ widgetId: random.id, config: {} });
        randomWidgetId = randomRes.body.widget.id;

        const cardRes = await request(app)
            .post('/api/widgets')
            .set('Authorization', `Bearer ${token}`)
            .send({ widgetId: card.id, config: { name: 'Dracaufeu' } });
        cardWidgetId = cardRes.body.widget.id;
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    afterAll(async () => {
        await prisma.user.deleteMany({
            where: { email: { contains: 'pokemon_test_' } },
        });
        await prisma.$disconnect();
    });

    it('GET /api/widgets/:id/data - pokemon_card devrait renvoyer la carte choisie', async () => {
        const fetchMock = mockTcgdex({ body: SEARCH_RESULTS });

        const res = await request(app)
            .get(`/api/widgets/${cardWidgetId}/data`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        // La carte au nom exact et illustrée est préférée à « Dracaufeu GX », pourtant en tête des résultats.
        expect(res.body.data).toEqual({
            id: 'base1-4',
            name: 'Dracaufeu',
            image: 'https://assets.tcgdex.net/fr/base/base1/4/high.webp',
        });
        expect(fetchMock).toHaveBeenCalledTimes(1);

        const searchUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
        expect(searchUrl.pathname).toBe('/v2/fr/cards');
        expect(searchUrl.searchParams.get('name')).toBe('Dracaufeu');
    });


    it('pokemon_card devrait chercher en anglais avec language: en', async () => {
        await request(app)
            .patch(`/api/widgets/${cardWidgetId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ config: { name: 'Squirtle', language: 'en' } });

        const fetchMock = mockTcgdex({
            body: [{ id: 'base1-63', name: 'Squirtle', image: 'https://assets.tcgdex.net/en/base/base1/63' }],
        });

        const res = await request(app)
            .get(`/api/widgets/${cardWidgetId}/data`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.image).toBe('https://assets.tcgdex.net/en/base/base1/63/high.webp');

        const searchUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
        expect(searchUrl.pathname).toBe('/v2/en/cards');
        expect(searchUrl.searchParams.get('name')).toBe('Squirtle');
    });

    it('pokemon_card devrait chercher en français si la langue est inconnue', async () => {
        await request(app)
            .patch(`/api/widgets/${cardWidgetId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ config: { name: 'Dracaufeu', language: 'klingon' } });

        const fetchMock = mockTcgdex({ body: SEARCH_RESULTS });

        await request(app)
            .get(`/api/widgets/${cardWidgetId}/data`)
            .set('Authorization', `Bearer ${token}`);

        expect(new URL(String(fetchMock.mock.calls[0]?.[0])).pathname).toBe('/v2/fr/cards');

        await request(app)
            .patch(`/api/widgets/${cardWidgetId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ config: { name: 'Dracaufeu' } });
    });

    it('pokemon_card devrait prendre la première carte illustrée sans correspondance exacte', async () => {
        await request(app)
            .patch(`/api/widgets/${cardWidgetId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ config: { name: 'dracau' } });

        mockTcgdex({ body: SEARCH_RESULTS });

        const res = await request(app)
            .get(`/api/widgets/${cardWidgetId}/data`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe('sm3-20');

        await request(app)
            .patch(`/api/widgets/${cardWidgetId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ config: { name: 'Dracaufeu' } });
    });

    it('GET /api/widgets/:id/data - pokemon_card 400 si aucune carte ne correspond', async () => {
        const fetchMock = mockTcgdex({ body: [] });

        const res = await request(app)
            .get(`/api/widgets/${cardWidgetId}/data`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Pokémon card not found.');
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('pokemon_card 400 si aucune carte correspondante n\'est illustrée', async () => {
        const fetchMock = mockTcgdex({ body: [{ id: '2024sv-1', localId: '1', name: 'Dracaufeu' }] });

        const res = await request(app)
            .get(`/api/widgets/${cardWidgetId}/data`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(400);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('GET /api/widgets/:id/data - pokemon_card 400 si le nom est absent', async () => {
        await request(app)
            .patch(`/api/widgets/${cardWidgetId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ config: { name: '  ' } });

        const fetchMock = mockTcgdex({ body: CHARIZARD });

        const res = await request(app)
            .get(`/api/widgets/${cardWidgetId}/data`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid widget configuration.');
        expect(fetchMock).not.toHaveBeenCalled();

        await request(app)
            .patch(`/api/widgets/${cardWidgetId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ config: { name: 'Dracaufeu' } });
    });

    it('GET /api/widgets/:id/data - pokemon_random_card devrait renvoyer une carte au hasard', async () => {
        const fetchMock = mockTcgdex({ body: CHARIZARD });

        const res = await request(app)
            .get(`/api/widgets/${randomWidgetId}/data`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe('base1-4');
        expect(res.body.data.image).toBe('https://assets.tcgdex.net/fr/base/base1/4/high.webp');
        expect(String(fetchMock.mock.calls[0]?.[0])).toBe('https://api.tcgdex.net/v2/fr/random/card');
    });

    it('pokemon_random_card devrait tirer une carte anglaise avec language: en', async () => {
        await request(app)
            .patch(`/api/widgets/${randomWidgetId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ config: { language: 'en' } });

        const fetchMock = mockTcgdex({ body: CHARIZARD });

        const res = await request(app)
            .get(`/api/widgets/${randomWidgetId}/data`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(String(fetchMock.mock.calls[0]?.[0])).toBe('https://api.tcgdex.net/v2/en/random/card');

        await request(app)
            .patch(`/api/widgets/${randomWidgetId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ config: {} });
    });

    it('pokemon_random_card devrait retirer une carte tant qu\'elle n\'a pas d\'image', async () => {
        const fetchMock = mockTcgdex({ body: CARD_WITHOUT_IMAGE }, { body: CARD_WITHOUT_IMAGE }, { body: CHARIZARD });

        const res = await request(app)
            .get(`/api/widgets/${randomWidgetId}/data`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe('base1-4');
        expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('pokemon_random_card 502 après 5 tirages sans image', async () => {
        const fetchMock = mockTcgdex({ body: CARD_WITHOUT_IMAGE });

        const res = await request(app)
            .get(`/api/widgets/${randomWidgetId}/data`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(502);
        expect(fetchMock).toHaveBeenCalledTimes(5);
    });

    it('GET /api/widgets/:id/data - 502 si TCGdex est indisponible', async () => {
        mockTcgdex({ body: { error: 'Internal error' }, status: 500 });

        const res = await request(app)
            .get(`/api/widgets/${randomWidgetId}/data`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(502);
    });

    it('GET /api/widgets/:id/data - 502 si le réseau est coupé', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));

        const res = await request(app)
            .get(`/api/widgets/${cardWidgetId}/data`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(502);
    });
});
