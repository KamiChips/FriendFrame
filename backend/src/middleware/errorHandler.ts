import 'pino-http';
import type { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    if (res.headersSent) {
        next(err);
        return;
    }

    const status = (err as { status?: number }).status;

    // Error del cliente (ej. body demasiado grande): se responde sin detalles.
    if (status && status >= 400 && status < 500) {
        res.status(status).json({
            error: status === 413 ? 'PAYLOAD_TOO_LARGE' : 'BAD_REQUEST',
        });
        return;
    }

    // El stack solo va al log, nunca a la respuesta.
    req.log.error({ err }, 'unhandled error');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
};
