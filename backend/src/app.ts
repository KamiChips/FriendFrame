import express from 'express';

// Crea la app de Express SIN arrancar el servidor.
// Separarlo de index.ts permite usar la app en los tests sin abrir un puerto.
export function createApp() {
    const app = express();

    // No anunciar "X-Powered-By: Express": le da pistas a un atacante.
    app.disable('x-powered-by');

    // Aquí se agregarán: helmet, CORS, límites y manejo de errores (F0-10),
    // y las rutas: /health (F0-11), /reports, /admin/...

    return app;
}
