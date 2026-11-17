import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.test') });

const nodeFetch = require('node-fetch');
Object.defineProperty(globalThis, 'fetch', {
    value: nodeFetch,
    writable: true,
    configurable: true,
});
