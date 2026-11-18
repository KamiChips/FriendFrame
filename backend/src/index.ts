import { createApp } from './app.js';
import { env } from './config/env.js';

const port = env.PORT;

const app = createApp();

app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API escuchando en el puerto ${port}`);
});
