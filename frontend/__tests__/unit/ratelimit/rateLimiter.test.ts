import { Ratelimit } from "@upstash/ratelimit";
import {
    LIMITS,
    loginAttempts,
    signupAttempts,
    postCreation,
    messageCreation,
    commentCreation,
    retryAfterSeconds,
    rateLimitMessage,
    rateLimitHeaders,
} from "@/services/ratelimit/rateLimiter";

jest.mock("@upstash/redis", () => ({
    Redis: { fromEnv: jest.fn(() => ({}) ) },
}));

jest.mock("@upstash/ratelimit", () => {
    const UNIT_MS: Record<string, number> = {
        s: 1_000,
        m: 60_000,
        h: 3_600_000,
        d: 86_400_000,
    };
    const toMs = (w: string) => {
        const [n, unit] = w.split(" ");
        return Number(n) * UNIT_MS[unit];
    };

    class Ratelimit {
        static mockShoouldFail = false;

        static slidingWindow(tokens: number, window: string) {
            return { tokens, windowMs: toMs(window) };
        }

        private hits = new Map<string, number[]>();
        private cfg: { tokens: number; windowMs: number };

        constructor(opts: { limiter: { tokens: number; windowMs: number } }) {
            this.cfg = opts.limiter;
        }

        async limit(id: string) {
            if (Ratelimit.mockShoouldFail) throw new Error("Redis down"); 

            const now = Date.now();
            const { tokens, windowMs } = this.cfg;
            const recent = (this.hits.get(id) ?? []).filter((t) => t > now - windowMs);

            const success = recent.length < tokens;
            if (success) recent.push(now);
            this.hits.set(id, recent);

            return {
                success,
                limit: tokens,
                remaining: Math.max(0, tokens - recent.length),
                reset: recent[0] + windowMs,
            };
        }
    }

    return { Ratelimit };
});

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;
const START = Date.now();

// Los limiters son singletones a nivel de modulo: cada test usa ids unicos para evitar interferencias
let counter = 0;
const uid = (prefix: string) => `${prefix}-${counter++}`;

const setRadisFailing = (fail: boolean) => {
    (Ratelimit as unknown as { mockShoouldFail: boolean }).mockShoouldFail = fail;
};

beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(START);
    setRadisFailing(false);
});

afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
});

describe('bloqueo despues de N intentos', () => {
    it('login: permite 5 intentos por email y bloquea el 6to', async () => {
        const email = `${uid('user')}@etest.com`;

        for (let i = 1; i <= LIMITS.login.max; i++) {
            const res = await loginAttempts(email);
            expect(res.success).toBe(true);
            expect(res.remaining).toBe(LIMITS.login.max - i);
        }

        const blocked = await loginAttempts(email);
        expect(blocked.success).toBe(false);
        expect(blocked.remaining).toBe(0);
    });

    it('login: normaliza el email (mayusculas y espacios)', async () => {
        const base = `${uid('case')}@eTest.com`;

        await loginAttempts(base);
        await loginAttempts(base.toUpperCase());
        await loginAttempts(`  ${base}  `);
        await loginAttempts(base);
        await loginAttempts(base);

        const blocked = await loginAttempts(base);
        expect(blocked.success).toBe(false);
    });

    it('login: los limites son independientes por email', async () => {
        const a = `${uid('a')}@etest.com`;
        const b = `${uid('b')}@etest.com`;

        for (let i = 1; i <= LIMITS.login.max; i++) await loginAttempts(a);

        expect((await loginAttempts(a)).success).toBe(false);
        expect((await loginAttempts(b)).success).toBe(true);
    });

    it('signup: permite 3 intentos por IP y bloquea el 4to', async () => {
        const ip = `10.0.0.${uid('ip').split('-')[1]}`;

        for (let i = 1; i <= LIMITS.signup.max; i++) {
            const res = await signupAttempts(ip);
            expect(res.success).toBe(true);
            expect(res.remaining).toBe(LIMITS.signup.max - i);
        }

        expect((await signupAttempts(ip)).success).toBe(false);
        expect((await signupAttempts('203.0.113.99')).remaining).toBe(true);
    });

    it.each([
        ['postCreation', postCreation, 50],
        ['commentCreation', commentCreation, 100],
        ['messageCreation', messageCreation, 10_000],
    ])(
        '$s: permite exactamente el maximo diario y luego bloquea',
        async(__name, fn, max) => {
            const userId = uid('user');

            let lastAllowed;
            for (let i = 0; i < max; i++) lastAllowed = await fn(userId);

            expect(lastAllowed?.success).toBe(true);
            expect(lastAllowed?.remaining).toBe(0);
            expect((await fn(userId)).success).toBe(false);
        }
    );

    it('los límites configurados coinciden con los criterios de aceptación', () => {
        expect(LIMITS.login.max).toBe(5);
        expect(LIMITS.signup.max).toBe(3);
        expect(LIMITS.message.max).toBe(10_000);
        expect(LIMITS.post.max).toBe(50);
        expect(LIMITS.comment.max).toBe(100);
    });
});

describe('reset despues de la ventana de tiempo', () => {
    it('login: sigue bloqueado dentro de la hora y se libera al pasarla', async () => {
        const email = `${uid('reset')}@test.com`;

        for (let i = 0; i < LIMITS.login.max; i++) await loginAttempts(email);
        expect((await loginAttempts(email)).success).toBe(false);

        jest.setSystemTime(new Date(START + 59 * MINUTE));
        expect((await loginAttempts(email)).success).toBe(false);

        jest.setSystemTime(new Date(START + HOUR + 1));
        const afterWindow = await loginAttempts(email);
        expect(afterWindow.success).toBe(true);
        expect(afterWindow.remaining).toBe(LIMITS.login.max - 1);
    });

    it('signup: se libera después de 1 hora', async () => {
        const ip = `198.51.100.${uid('ip').split('-')[1]}`;

        for (let i = 0; i < LIMITS.signup.max; i++) await signupAttempts(ip);
        expect((await signupAttempts(ip)).success).toBe(false);

        jest.setSystemTime(new Date(START + HOUR + 1));
        expect((await signupAttempts(ip)).success).toBe(true);
    });

    it('posts: el límite diario no se libera a la hora pero sí a las 24h', async () => {
        const userId = uid('daily');

        for (let i = 0; i < LIMITS.post.max; i++) await postCreation(userId);
        expect((await postCreation(userId)).success).toBe(false);

        jest.setSystemTime(new Date(START + 2 * HOUR));
        expect((await postCreation(userId)).success).toBe(false);

        jest.setSystemTime(new Date(START + 24 * HOUR + 1));
        expect((await postCreation(userId)).success).toBe(true);
    });

    it('sliding window: los intentos antiguos van liberando cupo gradualmente', async () => {
        const email = `${uid('slide')}@test.com`;

        // 2 intentos en t=0
        await loginAttempts(email);
        await loginAttempts(email);

        // 3 intentos en t=30min -> llega al máximo
        jest.setSystemTime(new Date(START + 30 * MINUTE));
        await loginAttempts(email);
        await loginAttempts(email);
        await loginAttempts(email);
        expect((await loginAttempts(email)).success).toBe(false);

        // t=1h+1ms: expiran los 2 de t=0, quedan 3 -> hay cupo para 2 más
        jest.setSystemTime(new Date(START + HOUR + 1));
        const first = await loginAttempts(email);
        const second = await loginAttempts(email);
        const third = await loginAttempts(email);

        expect(first.success).toBe(true);
        expect(second.success).toBe(true);
        expect(third.success).toBe(false);
    });
});

describe('informacion de reset',  () => {
    it('retorna { success, remaining, resetAt } con los tipos correctos', async () => {
        const res = await loginAttempts(`${uid('shape')}@test.com`);

        expect(res).toEqual({
            success: expect.any(Boolean),
            remaining: expect.any(Number),
            resetAt: expect.any(Date),
        });
    });

    it('resetAt está en el futuro y dentro de la ventana (permitido)', async () => {
        const res = await loginAttempts(`${uid('future')}@test.com`);

        expect(res.resetAt.getTime()).toBeGreaterThan(Date.now());
        expect(res.resetAt.getTime()).toBeLessThanOrEqual(Date.now() + HOUR);
    });

    it('resetAt está en el futuro y dentro de la ventana (bloqueado)', async () => {
        const email = `${uid('blocked')}@test.com`;
        for (let i = 0; i < LIMITS.login.max; i++) await loginAttempts(email);

        const blocked = await loginAttempts(email);

        expect(blocked.success).toBe(false);
        expect(blocked.resetAt.getTime()).toBeGreaterThan(Date.now());
        expect(blocked.resetAt.getTime()).toBeLessThanOrEqual(Date.now() + HOUR);
    });

    it('retryAfterSeconds devuelve segundos positivos hasta el reset', async () => {
        const email = `${uid('retry')}@test.com`;
        for (let i = 0; i < LIMITS.login.max; i++) await loginAttempts(email);
        const blocked = await loginAttempts(email);

        const seconds = retryAfterSeconds(blocked);
        expect(seconds).toBeGreaterThanOrEqual(1);
        expect(seconds).toBeLessThanOrEqual(3600);
    });

    it('retryAfterSeconds nunca baja de 1 aunque resetAt ya haya pasado', () => {
        const past = {
            success: false,
            remaining: 0,
            resetAt: new Date(Date.now() - 5_000),
        };
        expect(retryAfterSeconds(past)).toBe(1);
    });

    it('rateLimitMessage: contador cuando está permitido, aviso cuando está bloqueado', async () => {
        const email = `${uid('msg')}@test.com`;

        const allowed = await loginAttempts(email);
        expect(rateLimitMessage('login', allowed)).toContain(
            `Te quedan ${allowed.remaining}`
        );

        for (let i = 0; i < LIMITS.login.max; i++) await loginAttempts(email);
        const blocked = await loginAttempts(email);
        expect(rateLimitMessage('login', blocked)).toMatch(/Inténtalo de nuevo/);
    });

    it('rateLimitHeaders: incluye Retry-After solo cuando está bloqueado', async () => {
        const email = `${uid('hdr')}@test.com`;

        const allowed = await loginAttempts(email);
        const allowedHeaders = rateLimitHeaders('login', allowed);
        expect(allowedHeaders['X-RateLimit-Limit']).toBe('5');
        expect(allowedHeaders['X-RateLimit-Remaining']).toBe('4');
        expect(allowedHeaders['Retry-After']).toBeUndefined();

        for (let i = 0; i < LIMITS.login.max; i++) await loginAttempts(email);
        const blocked = await loginAttempts(email);
        const blockedHeaders = rateLimitHeaders('login', blocked);
        expect(blockedHeaders['X-RateLimit-Remaining']).toBe('0');
        expect(blockedHeaders['Retry-After']).toBeDefined();
    });
});

describe('politica ante fallo de Redis', () => {
    beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
        setRadisFailing(true);
    });

    it.each([
        ['loginAttempts', () => loginAttempts('fail@test.com')],
        ['signupAttempts', () => signupAttempts('192.0.2.1')],
    ])('%s: fail-closed (bloquea)', async (_name, call) => {
        const res = await call();
        expect(res.success).toBe(false);
        expect(res.remaining).toBe(0);
        expect(res.resetAt).toBeInstanceOf(Date);
    });

    it.each([
        ['postCreation', () => postCreation('u1'), LIMITS.post.max],
        ['messageCreation', () => messageCreation('u1'), LIMITS.message.max],
        ['commentCreation', () => commentCreation('u1'), LIMITS.comment.max],
    ])('%s: fail-open (permite)', async (_name, call, max) => {
        const res = await call();
        expect(res.success).toBe(true);
        expect(res.remaining).toBe(max);
    });
});