import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';

describe('User Widgets API Integration Tests', () => {
    const testUser = {
        email: `widget_test_${Date.now()}@epitech.eu`,
        password: 'Password1234!',
        name: 'Widget Tester',
    };

    let token = '';
    let availableWidgetId = '';
    let createdUserWidgetId = '';

    beforeAll(async () => {
        // 1. Récupérer un widget existant issu du seed
        const widget = await prisma.widget.findFirst();
        if (!widget) throw new Error('Lance le seed avant les tests.');
        availableWidgetId = widget.id;

        // 2. Créer et valider un utilisateur
        await prisma.user.create({
            data: {
                email: testUser.email,
                password: 'hashed_dummy_password',
                isVerified: true,
            },
        });
        // Si le mot de passe n'est pas hashé via bcrypt dans le create direct,
        // on utilise le token généré par requireAuth ou un login direct
        // Pour simplifier l'obtention du token en test :
        const authRes = await request(app)
            .post('/api/auth/register')
            .send({ email: `auth_${Date.now()}@epitech.eu`, password: 'Password1234!' });

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