import { supabase } from '@/lib/supabase/client';
import {
    DEFAULT_LIMIT,
    MAX_PAGE_LIMIT,
    PaginationParams,
    ProfileStats,
} from './types';

export function normalizePagination(params: PaginationParams): {
    limit: number;
    offset: number;
} {
    const page = Math.max(0, Math.floor(params.page ?? 0));
    const limit = Math.min(
        MAX_PAGE_LIMIT,
        Math.max(1, Math.floor(params.limit ?? DEFAULT_LIMIT))
    );
    return { limit, offset: page * limit };
}

export function parseError(err: unknown): string {
    if (!err) return 'Unknown error';
    const msg = (err as Error).message ?? String(err);

    const known: [string, string][] = [
        ['PGRST116', 'User not found.'],
        ['No rows found', 'User not found.'],
        [
            'row-level security',
            'You do not have permission to perform this action.',
        ],
        ['NetworkError', 'Network error. Check your connection.'],
        ['Failed to fetch', 'Network error. Check your connection.'],
    ];

    for (const [key, value] of known) {
        if (msg.includes(key)) return value;
    }

    if (
        msg.startsWith('No active session') ||
        msg.includes('Invalid') ||
        msg.startsWith('The search') ||
        msg.startsWith('User')
    )
        return msg;

    return 'An unexpected error occurred.';
}

//Estadisticas de perfil
//followers, following, friends, posts, y fragments

export async function computeStats(userId: string): Promise<ProfileStats> {
    const { data, error } = (await supabase
        .rpc('get_profile_stats', { target_user_id: userId })
        .single()) as { data: any; error: any };

    if (error) throw error;

    const posts_count = Number(data.posts_count ?? 0);
    const fragments_count = Number(data.fragments_count ?? 0);

    return {
        followers_count: Number(data.followers_count ?? 0),
        following_count: Number(data.following_count ?? 0),
        friends_count: Number(data.friends_count ?? 0),
        posts_count,
        fragments_count,
        publications_count: posts_count + fragments_count,
    };
}
