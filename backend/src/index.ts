import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 3000);

const app = createApp();

app.listen(port, () => {
    // eslint-disable-next-line no-console -- temporal hasta tener logger (F0-10)
    console.log(`API escuchando en el puerto ${port}`);
});
