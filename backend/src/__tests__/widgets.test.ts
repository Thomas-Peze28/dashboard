import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';

describe('User Widgets API Integration Tests', () => {

    let token = '';
    let availableWidgetId = '';
    let createdUserWidgetId = '';

    beforeAll(async () => {
        // 1. Récupérer ou créer un service et un widget pour le test
        let widget = await prisma.widget.findFirst();

        if (!widget) {
            const service = await prisma.service.upsert({
                where: { name: 'time' },
                update: {},
                create: {
                    name: 'time',
                    description: 'Time service for tests',
                },
            });

            widget = await prisma.widget.create({
                data: {
                    serviceId: service.id,
                    name: 'digital_clock',
                    description: 'Digital clock test',
                },
            });
        }

        availableWidgetId = widget.id;

        // 2. Création et validation de l'utilisateur de test
        const authRes = await request(app)
            .post('/api/auth/register')
            .send({ email: `widget_test_${Date.now()}@epitech.eu`, password: 'Password1234!' });

        await prisma.user.update({
            where: { id: authRes.body.user.id },
            data: { isVerified: true },
        });

        const finalLogin = await request(app)
            .post('/api/auth/login')
            .send({ email: authRes.body.user.email, password: 'Password1234!' });

        token = finalLogin.body.token;
    });

    afterAll(async () => {
        await prisma.user.deleteMany({
            where: { email: { contains: 'widget_test_' } },
        });
        await prisma.$disconnect();
    });

    it('POST /api/widgets - devrait créer un widget utilisateur', async () => {
        const res = await request(app)
            .post('/api/widgets')
            .set('Authorization', `Bearer ${token}`)
            .send({
                widgetId: availableWidgetId,
                config: { timezone: 'Europe/Paris' },
                positionX: 0,
                positionY: 0,
                width: 2,
                height: 2,
            });

        expect(res.status).toBe(201);
        expect(res.body.widget).toHaveProperty('id');
        expect(res.body.widget.config).toEqual({ timezone: 'Europe/Paris' });
        expect(res.body.widget.positionX).toBe(0);
        expect(res.body.widget.positionY).toBe(0);
        expect(res.body.widget.width).toBe(2);
        expect(res.body.widget.height).toBe(2);
        expect(res.body.widget.refreshInterval).toBe(30);
        createdUserWidgetId = res.body.widget.id;
    });

    it('GET /api/widgets - devrait lister les widgets de l\'utilisateur', async () => {
        const res = await request(app)
            .get('/api/widgets')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.widgets)).toBe(true);
        expect(res.body.widgets.length).toBeGreaterThanOrEqual(1);
        expect(res.body.widgets[0].id).toBe(createdUserWidgetId);
    });

    it('PATCH /api/widgets/:id - devrait mettre à jour la position et la config', async () => {
        const res = await request(app)
            .patch(`/api/widgets/${createdUserWidgetId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                positionX: 3,
                positionY: 2,
                config: { timezone: 'America/New_York' },
            });

        expect(res.status).toBe(200);
        expect(res.body.widget.positionX).toBe(3);
        expect(res.body.widget.positionY).toBe(2);
        expect(res.body.widget.config).toEqual({ timezone: 'America/New_York' });
    });

    it('PATCH /api/widgets/:id - devrait mettre à jour refreshInterval sans toucher la config', async () => {
        const res = await request(app)
            .patch(`/api/widgets/${createdUserWidgetId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ refreshInterval: 10 });

        expect(res.status).toBe(200);
        expect(res.body.widget.refreshInterval).toBe(10);
        expect(res.body.widget.config).toEqual({ timezone: 'America/New_York' });
    });

    it.each([4, 0, -10, 2.5, '10', null])('PATCH /api/widgets/:id - 400 si refreshInterval vaut %j', async (refreshInterval) => {
        const res = await request(app)
            .patch(`/api/widgets/${createdUserWidgetId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ refreshInterval });

        expect(res.status).toBe(400);
    });

    it('POST /api/widgets - devrait accepter un refreshInterval personnalisé', async () => {
        const res = await request(app)
            .post('/api/widgets')
            .set('Authorization', `Bearer ${token}`)
            .send({
                widgetId: availableWidgetId,
                config: { timezone: 'Europe/Paris' },
                refreshInterval: 5,
            });

        expect(res.status).toBe(201);
        expect(res.body.widget.refreshInterval).toBe(5);
    });

    it.each([4, 2.5, '60'])('POST /api/widgets - 400 si refreshInterval vaut %j', async (refreshInterval) => {
        const res = await request(app)
            .post('/api/widgets')
            .set('Authorization', `Bearer ${token}`)
            .send({
                widgetId: availableWidgetId,
                config: { timezone: 'Europe/Paris' },
                refreshInterval,
            });

        expect(res.status).toBe(400);
    });

    it('GET /api/widgets/:id/data - devrait renvoyer l\'heure calculée', async () => {
        const res = await request(app)
            .get(`/api/widgets/${createdUserWidgetId}/data`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('timezone');
        expect(res.body.data).toHaveProperty('time');
        expect(res.body.data).toHaveProperty('date');

        // Vérifie le format de l'heure (HH:mm:ss)
        expect(res.body.data.time).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    it('GET /api/widgets/:id/data - 404 si widget inexistant ou non possédé', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000000';
        const res = await request(app)
            .get(`/api/widgets/${fakeId}/data`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });

    it('DELETE /api/widgets/:id - devrait supprimer le widget', async () => {
        const res = await request(app)
            .delete(`/api/widgets/${createdUserWidgetId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(204);
        const getRes = await request(app)
            .get('/api/widgets')
            .set('Authorization', `Bearer ${token}`);
        const exists = getRes.body.widgets.some((widget: { id: string }) => widget.id === createdUserWidgetId);
        expect(exists).toBe(false);
    });
});