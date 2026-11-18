import { createApp } from './app.js';
import { env } from './config/env.js';

const port = env.PORT;

const app = createApp({
    nodeEnv: env.NODE_ENV,
    corsOrigins: env.CORS_ORIGINS,
});

app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API escuchando en el puerto ${port}`);
});
