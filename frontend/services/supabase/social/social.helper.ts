import { PaginationParams } from './social.types';

const MAX_PAGE_LIMIT = 50;
const DEFAULT_LIMIT = 30;

export function normalizePagination(params: PaginationParams): {
    from: number;
    to: number;
} {
    const page = Math.max(0, Math.floor(params.page ?? 0));
    const limit = Math.min(
        MAX_PAGE_LIMIT,
        Math.max(1, Math.floor(params.limit ?? DEFAULT_LIMIT))
    );

    return { from: page * limit, to: page * limit + limit - 1 };
}

export function parseError(err: unknown): string {
    if (!err) return 'Unknown error';
    const msg = (err as Error).message ?? String(err);

    const map: [string, string][] = [
        [
            'duplicate key value violates unique constraint "follows',
            'You are already following this user.',
        ],
        [
            'duplicate key value violates unique constraint "blocks',
            'You have already blocked this user.',
        ],
        [
            'violates check constraint',
            'You cannot perform this action on yourself.',
        ],
        [
            'row-level security',
            'You do not have permission to perform this action.',
        ],
        ['NetworkError', 'Network error. Check your connection.'],
        ['Failed to fetch', 'Network error. Check your connection.'],
        ['No active session', msg],
        ['You cannot', msg],
        ['You are already following', msg],
        ['You have already blocked', msg],
        ['You have blocked', msg],
        ['You can only', msg],
        ['Invalid', msg],
    ];

    for (const [key, value] of map) {
        if (msg.includes(key)) return value;
    }

    return 'An unexpected error occurred.';
}
