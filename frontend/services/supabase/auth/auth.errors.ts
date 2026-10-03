import { MIN_PASSWORD_LEN } from './auth.types';

export function parseAuthError(error: unknown): string {
    if (!error) return 'Unknown error';
    const msg = (error as Error).message ?? String(error);

    const known: [string, string][] = [
        [
            'User already registered',
            'An account with that email already exists.',
        ],
        ['Invalid login credentials', 'Invalid email or password.'],
        ['Email not confirmed', 'Please confirm your email before logging in.'],
        [
            'Password should be at least',
            `Password must be at least ${MIN_PASSWORD_LEN} characters.`,
        ],
        ['Unable to validate email address', 'Invalid email format.'],
        ['duplicate key.*username', 'That username is already taken.'],
        ['Auth session missing', 'No active session.'],
        ['NetworkError', 'Network error. Check your connection.'],
        ['Failed to fetch', 'Network error. Check your connection.'],
        [
            'over_email_send_rate_limit',
            'Too many attempts. Please wait a few minutes.',
        ],
        [
            'Token has expired',
            'The link has expired. Please request a new one.',
        ],
    ];

    for (const [pattern, message] of known) {
        if (new RegExp(pattern).test(msg)) return message;
    }

    if (
        msg.startsWith('El email') ||
        msg.startsWith('La contraseña') ||
        msg.startsWith('El nombre') ||
        msg.startsWith('El username') ||
        msg.startsWith('La URL') ||
        msg.startsWith('No hay sesión') ||
        msg.startsWith('El ID')
    )
        return msg;

    return 'An unexpected error occurred.';
}
