import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z
        .enum(['development', 'test', 'production'])
        .default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.url(),
    BLOB_CONNECTION_STRING: z.string().min(1),
    JWT_SECRET: z.string().min(32),
    CORS_ORIGINS: z.string().min(1),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
    // eslint-disable-next-line no-console
    console.error('Invalid Configuration. Check your .env');

    for (const issue of result.error.issues) {
        // eslint-disable-next-line no-console
        console.error(`Problem ${issue.path.join('.')} : ${issue.message}`);
    }

    process.exit(1);
}

export const env = result.data;
