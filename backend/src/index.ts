import { createApp } from './app.js';
import { env } from './config/env.js';

const port = Number(env.PORT ?? 3000);

const app = createApp();

app.listen(port, () => {
    console.log(`API escuchando en el puerto ${port}`);
});
