import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';

describe('app', () => {
    it('no expone X-Powered-By', async () => {
        const res = await request(createApp()).get('/no-existe');
        expect(res.headers['x-powered-by']).toBeUndefined();
    });
});
