import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';

const PANEL = 'https://panel.example.com';
const config = { nodeEnv: 'test' as const, corsOrigins: [PANEL] };

describe('base API security', () => {
    it('hides X-Powered-By and applies helmet headers', async () => {
        const res = await request(createApp(config)).get('/');
        expect(res.headers['x-powered-by']).toBeUndefined();
        expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('sends no CORS headers to a disallowed origin', async () => {
        const res = await request(createApp(config))
            .get('/')
            .set('Origin', 'https://otro-sitio.com');
        expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('allows the panel and, only in development, localhost', async () => {
        const panel = await request(createApp(config))
            .get('/')
            .set('Origin', PANEL);
        expect(panel.headers['access-control-allow-origin']).toBe(PANEL);

        const dev = await request(
            createApp({ ...config, nodeEnv: 'development' })
        )
            .get('/')
            .set('Origin', 'http://localhost:5173');
        expect(dev.headers['access-control-allow-origin']).toBe(
            'http://localhost:5173'
        );

        const prod = await request(
            createApp({ ...config, nodeEnv: 'production' })
        )
            .get('/')
            .set('Origin', 'http://localhost:5173');
        expect(prod.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('responds 413 to a 1 MB body', async () => {
        const res = await request(createApp(config))
            .post('/')
            .send({ data: 'x'.repeat(1024 * 1024) });
        expect(res.status).toBe(413);
    });

    it('responds 500 with a generic error and no stack', async () => {
        const app = createApp(config, (a) => {
            a.get('/boom', () => {
                throw new Error('internal secret');
            });
        });
        const res = await request(app).get('/boom');
        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: 'INTERNAL_ERROR' });
        expect(res.text).not.toContain('internal secret');
    });

    it('responds 429 on the 301st request from the same IP', async () => {
        const agent = request(createApp(config));
        for (let i = 0; i < 300; i++) {
            await agent.get('/');
        }
        const res = await agent.get('/');
        expect(res.status).toBe(429);
    });
});
