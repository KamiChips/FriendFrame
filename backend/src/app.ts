import { randomUUID } from 'node:crypto';
import cors from 'cors';
import express, { type Express } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { errorHandler } from './middleware/errorHandler.js';

export interface AppConfig {
    nodeEnv?: 'development' | 'test' | 'production';
    corsOrigins?: string[];
}

const LOCALHOST = /^http:\/\/localhost(:\d+)?$/;

// Crea la app de Express SIN arrancar el servidor.
// Separarlo de index.ts permite usar la app en los tests sin abrir un puerto.
export function createApp(
    config: AppConfig = {},
    registerRoutes?: (app: Express) => void
) {
    // Si no se indica, se asume producción (lo más restrictivo).
    const nodeEnv = config.nodeEnv ?? 'production';
    const allowedOrigins = new Set(config.corsOrigins);

    const app = express();

    // No anunciar "X-Powered-By: Express": le da pistas a un atacante.
    app.disable('x-powered-by');

    // Aquí se agregarán las rutas: /health (F0-11), /reports, /admin/...

    // Logs: solo id, método, ruta (sin query) y status. Nunca headers ni body.
    app.use(
        pinoHttp({
            level: nodeEnv === 'test' ? 'silent' : 'info',
            genReqId: () => randomUUID(),
            serializers: {
                req: (req: { id: unknown; method: string; url: string }) => ({
                    id: req.id,
                    method: req.method,
                    url: req.url.split('?')[0],
                }),
                res: (res: { statusCode: number }) => ({
                    statusCode: res.statusCode,
                }),
            },
        })
    );

    app.use(helmet());

    // Lista blanca: el panel y, fuera de producción, localhost.
    app.use(
        cors({
            origin(origin, callback) {
                if (!origin) {
                    // Sin Origin no es un navegador (app móvil, curl, tests).
                    callback(null, true);
                } else {
                    // false = sin headers CORS, el navegador bloquea la petición.
                    callback(
                        null,
                        allowedOrigins.has(origin) ||
                            (nodeEnv !== 'production' && LOCALHOST.test(origin))
                    );
                }
            },
        })
    );

    // 300 peticiones por IP cada 15 minutos.
    app.use(
        rateLimit({
            windowMs: 15 * 60 * 1000,
            limit: 300,
            message: { error: 'TOO_MANY_REQUESTS' },
        })
    );

    // Máximo 100 KB de JSON por petición.
    app.use(express.json({ limit: '100kb' }));

    // Aquí se agregarán las rutas: /health (F0-11), /reports, /admin/...
    registerRoutes?.(app);

    // Siempre al final: las rutas nuevas van antes de esta línea.
    app.use(errorHandler);

    return app;
}
