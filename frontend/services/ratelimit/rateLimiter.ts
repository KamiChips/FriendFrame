import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export interface RateLimitResult {
    success: boolean; // true si la acción está permitida
    remaining: number; // intentos/acciones restantes en la ventana actual
    resetAt: Date; // momento en que el límite se reinicia
}

export type RateLimitAction =
    'login' | 'signup' | 'post' | 'message' | 'comment';

const redis = Redis.fromEnv();

// Configuración central de límites
export const LIMITS = {
    login: { max: 5, window: '1 h' },
    signup: { max: 3, window: '1 h' },
    message: { max: 10_000, window: '1 d' },
    post: { max: 50, window: '1 d' },
    comment: { max: 100, window: '1 d' },
} as const;

const createLimiter = (action: RateLimitAction) =>
    new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(
            LIMITS[action].max,
            LIMITS[action].window
        ),
        prefix: `ratelimit:${action}`,
        analytics: true,
    });

const limiters: Record<RateLimitAction, Ratelimit> = {
    login: createLimiter('login'),
    signup: createLimiter('signup'),
    message: createLimiter('message'),
    post: createLimiter('post'),
    comment: createLimiter('comment'),
};

// Consume 1 unidad del límite y devuelve el resultado normalizado
async function check(
    action: RateLimitAction,
    identifier: string,
    failOpen: boolean
): Promise<RateLimitResult> {
    try {
        const { success, remaining, reset } =
            await limiters[action].limit(identifier);
        return {
            success,
            remaining: Math.max(0, remaining),
            resetAt: new Date(reset),
        };
    } catch (error) {
        console.error(`[ratelimit:${action}] Redis error`, error);
        return {
            success: failOpen,
            remaining: failOpen ? LIMITS[action].max : 0,
            resetAt: new Date(Date.now() + 60_000),
        };
    }
}

// Máx 5 intentos de login fallidos por hora, por email
export function loginAttempts(email: string): Promise<RateLimitResult> {
    return check('login', email.trim().toLowerCase(), false);
}

// Máx 3 signups por hora, por IP
export function signupAttempts(ip: string): Promise<RateLimitResult> {
    return check('signup', ip, false);
}

// Máx 50 posts por día, por usuario
export function postCreation(userId: string): Promise<RateLimitResult> {
    return check('post', userId, true);
}

// Máx 10,000 mensajes por día, por usuario
export function messageCreation(userId: string): Promise<RateLimitResult> {
    return check('message', userId, true);
}

// Máx 100 comentarios por día, por usuario
export function commentCreation(userId: string): Promise<RateLimitResult> {
    return check('comment', userId, true);
}

// Helpers de UX: mensaje claro + contador de intentos restantes

const LABELS: Record<RateLimitAction, { blocked: string; remaining: string }> =
    {
        login: {
            blocked: 'Demasiados intentos de inicio de sesión fallidos',
            remaining: 'intentos de inicio de sesión',
        },
        signup: {
            blocked: 'Has alcanzado el límite de registros desde tu red',
            remaining: 'registros',
        },
        post: {
            blocked: 'Has alcanzado el límite diario de publicaciones',
            remaining: 'publicaciones hoy',
        },
        message: {
            blocked: 'Has alcanzado el límite diario de mensajes',
            remaining: 'mensajes hoy',
        },
        comment: {
            blocked: 'Has alcanzado el límite diario de comentarios',
            remaining: 'comentarios hoy',
        },
    };

// Segundos hasta que el límite se reinicia (para el header Retry-After)
export function retryAfterSeconds(result: RateLimitResult): number {
    return Math.max(
        1,
        Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)
    );
}

function formatWait(seconds: number): string {
    if (seconds < 60) return `${seconds} segundos`;
    const minutes = Math.ceil(seconds / 60);
    if (minutes < 60) return `${minutes} minuto${minutes === 1 ? '' : 's'}`;
    const hours = Math.ceil(minutes / 60);
    return `${hours} hora${hours === 1 ? '' : 's'}`;
}

// Mensaje listo para mostrar al usuario
export function rateLimitMessage(
    action: RateLimitAction,
    result: RateLimitResult
): string {
    const label = LABELS[action];
    if (!result.success) {
        return `${label.blocked}. Inténtalo de nuevo en ${formatWait(
            retryAfterSeconds(result)
        )}.`;
    }
    return `Te quedan ${result.remaining} ${label.remaining}.`;
}

// Headers estándar para respuestas HTTP (contador visible)
export function rateLimitHeaders(
    action: RateLimitAction,
    result: RateLimitResult
): Record<string, string> {
    const headers: Record<string, string> = {
        'X-RateLimit-Limit': String(LIMITS[action].max),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.ceil(result.resetAt.getTime() / 1000)),
    };
    if (!result.success) {
        headers['Retry-After'] = String(retryAfterSeconds(result));
    }
    return headers;
}
