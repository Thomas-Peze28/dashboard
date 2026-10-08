import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { clearGeocodingCache } from '../services/widgets/weather/openMeteo.js';

const GEOCODING_LILLE = {
    results: [{ name: 'Lille', country: 'France', latitude: 50.63, longitude: 3.06 }],
};

const CURRENT_LILLE = {
    current: {
        time: '2026-10-08T10:45',
        temperature_2m: 14.2,
        apparent_temperature: 12.9,
        relative_humidity_2m: 81,
        wind_speed_10m: 17.5,
        weather_code: 3,
        is_day: 1,
    },
};

const FORECAST_LILLE = {
    daily: {
        time: ['2026-10-08', '2026-10-09', '2026-10-10'],
        weather_code: [3, 61, 0],
        temperature_2m_max: [16.1, 13.4, 17.8],
        temperature_2m_min: [9.3, 8.7, 7.2],
        precipitation_sum: [0, 6.4, 0],
    },
};

const jsonResponse = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/**
* Stubs global fetch: geocoding calls return `geocoding`, forecast calls return `forecast`.
**/
const mockOpenMeteo = (geocoding: unknown, forecast: unknown, forecastStatus = 200) => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
        const url = input instanceof Request ? input.url : input.toString();
        return url.includes('geocoding-api')
            ? jsonResponse(geocoding)
            : jsonResponse(forecast, forecastStatus);
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
};

/**
* Returns the catalog widget with the given name, creating the weather service entry if the database is not seeded.
**/
const ensureWeatherWidget = async (name: string) => {
    const service = await prisma.service.upsert({
        where: { name: 'weather' },
        update: {},
        create: { name: 'weather', description: 'Weather service for tests' },
    });

    const existing = await prisma.widget.findFirst({ where: { serviceId: service.id, name } });
    return existing ?? prisma.widget.create({ data: { serviceId: service.id, name, description: name } });
};

describe('Weather widgets Integration Tests', () => {

    let token = '';
    let currentWidgetId = '';
    let forecastWidgetId = '';

    beforeAll(async () => {
        const current = await ensureWeatherWidget('weather_current');
        const forecast = await ensureWeatherWidget('weather_forecast');

        const authRes = await request(app)
            .post('/api/auth/register')
            .send({ email: `weather_test_${Date.now()}@epitech.eu`, password: 'Password1234!' });

        await prisma.user.update({
            where: { id: authRes.body.user.id },
            data: { isVerified: true },
        });

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: authRes.body.user.email, password: 'Password1234!' });

        token = loginRes.body.token;

        const currentRes = await request(app)
            .post('/api/widgets')
            .set('Authorization', `Bearer ${token}`)
            .send({ widgetId: current.id, config: { city: 'Lille' } });
        currentWidgetId = currentRes.body.widget.id;

        const forecastRes = await request(app)
            .post('/api/widgets')
            .set('Authorization', `Bearer ${token}`)
            .send({ widgetId: forecast.id, config: { city: 'Lille', days: 3 } });
        forecastWidgetId = forecastRes.body.widget.id;
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        clearGeocodingCache();
    });

    afterAll(async () => {
        await prisma.user.deleteMany({
            where: { email: { contains: 'weather_test_' } },
        });
        await prisma.$disconnect();
    });

    it('GET /api/widgets/:id/data - weather_current devrait renvoyer la météo actuelle', async () => {
        mockOpenMeteo(GEOCODING_LILLE, CURRENT_LILLE);

        const res = await request(app)
            .get(`/api/widgets/${currentWidgetId}/data`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject({
            city: 'Lille',
            country: 'France',
            temperature: 14.2,
            humidity: 81,
            windSpeed: 17.5,
            weatherCode: 3,
            description: 'Overcast',
            isDay: true,
        });
    });

    it('GET /api/widgets/:id/data - weather_forecast devrait renvoyer les prévisions', async () => {
        const fetchMock = mockOpenMeteo(GEOCODING_LILLE, FORECAST_LILLE);

        const res = await request(app)
            .get(`/api/widgets/${forecastWidgetId}/data`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.city).toBe('Lille');
        expect(res.body.data.days).toHaveLength(3);
        expect(res.body.data.days[1]).toEqual({
            date: '2026-10-09',
            weatherCode: 61,
            description: 'Slight rain',
            temperatureMax: 13.4,
            temperatureMin: 8.7,
            precipitation: 6.4,
        });

        const forecastUrl = new URL(String(fetchMock.mock.calls[1]?.[0]));
        expect(forecastUrl.searchParams.get('forecast_days')).toBe('3');
    });

    it('devrait mettre en cache le géocodage entre deux rafraîchissements', async () => {
        const fetchMock = mockOpenMeteo(GEOCODING_LILLE, CURRENT_LILLE);

        for (let i = 0; i < 2; i++) {
            await request(app)
                .get(`/api/widgets/${currentWidgetId}/data`)
                .set('Authorization', `Bearer ${token}`);
        }

        const geocodingCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes('geocoding-api'));
        expect(geocodingCalls).toHaveLength(1);
        expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('GET /api/widgets/:id/data - 400 si la ville est introuvable', async () => {
        mockOpenMeteo({}, CURRENT_LILLE);

        const res = await request(app)
            .get(`/api/widgets/${currentWidgetId}/data`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('City not found.');
    });

    it('GET /api/widgets/:id/data - 502 si Open-Meteo est indisponible', async () => {
        mockOpenMeteo(GEOCODING_LILLE, { error: true, reason: 'Internal error' }, 500);

        const res = await request(app)
            .get(`/api/widgets/${currentWidgetId}/data`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(502);
    });

    it('GET /api/widgets/:id/data - 502 si le réseau est coupé', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));

        const res = await request(app)
            .get(`/api/widgets/${forecastWidgetId}/data`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(502);
    });

    it('PATCH /api/widgets/:id - devrait borner days entre 1 et 7', async () => {
        await request(app)
            .patch(`/api/widgets/${forecastWidgetId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ config: { city: 'Lille', days: 30 } });

        const fetchMock = mockOpenMeteo(GEOCODING_LILLE, FORECAST_LILLE);

        await request(app)
            .get(`/api/widgets/${forecastWidgetId}/data`)
            .set('Authorization', `Bearer ${token}`);

        const forecastUrl = new URL(String(fetchMock.mock.calls[1]?.[0]));
        expect(forecastUrl.searchParams.get('forecast_days')).toBe('10');
    });
});
