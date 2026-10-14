import { supabase } from '@/lib/supabase/client';
import {
    PublicationTarget,
    DEFAULT_LIMIT,
    MAX_PAGE_LIMIT,
    MAX_COMMENT_LENGTH,
    CommentWithReplies,
    AppComment as Comment,
    CommentStats,
} from './types';
import { assertUUID } from '../helpers/validation';

export function assertTarget(target: PublicationTarget): void {
    const id = target.postId ?? target.fragmentId;
    if (!id) throw new Error('postId or fragmentId is required.');
    assertUUID(id, target.postId ? 'postId' : 'fragmentId');
}

export function normalizePagination(
    page = 0,
    limit = DEFAULT_LIMIT
): { from: number; to: number } {
    const p = Math.max(0, Math.floor(page));
    const l = Math.min(MAX_PAGE_LIMIT, Math.max(1, Math.floor(limit)));
    return { from: p * l, to: p * l + l - 1 };
}

export function validateContent(content: string, label = 'content'): string {
    const trimmed = content.trim();
    if (!trimmed) throw new Error(`The ${label} cannot be empty.`);
    if (trimmed.length > MAX_COMMENT_LENGTH)
        throw new Error(
            `The ${label} cannot exceed ${MAX_COMMENT_LENGTH} characters.`
        );
    return trimmed;
}

export function parseError(err: unknown): string {
    if (!err) return 'Unknown error';
    const msg = (err as Error).message ?? String(err);

    const known: [string, string][] = [
        [
            'row-level security',
            'You do not have permission to perform this action.',
        ],
        [
            'duplicate key value violates unique constraint',
            'You already liked this post.',
        ],
        ['violates check constraint', 'Validation error.'],
        ['NetworkError', 'Network error. Check your connection.'],
        ['Failed to fetch', 'Network error. Check your connection.'],
    ];

    for (const [key, value] of known) {
        if (msg.includes(key)) return value;
    }

    if (
        msg.startsWith('No active session') ||
        msg.startsWith('No hay sesión') ||
        msg.startsWith('The comment') ||
        msg.startsWith('El comentario') ||
        msg.startsWith('The content') ||
        msg.includes('is required') ||
        msg.includes('Invalid') ||
        msg.includes('inválido') ||
        msg.includes('cannot') ||
        msg.includes('no puede') ||
        msg.includes('does not exist') ||
        msg.includes('no existe') ||
        msg.includes('does not belong') ||
        msg.includes('no pertenece')
    )
        return msg;

    return 'An unexpected error occurred.';
}

export async function attachStatsToComments(
    comments: Comment[],
    currentUserId: string
): Promise<Comment[]> {
    if (comments.length === 0) return [];

    const ids = comments.map((c) => c.comment_id);

    const { data: stats, error } = await supabase.rpc('get_comment_stats', {
        comment_ids: ids,
        current_user_id: currentUserId,
    });

    if (error) throw error;

    const typedStats = (stats ?? []) as CommentStats[];

    const statsMap = new Map<string, CommentStats>(
        typedStats.map((s) => [s.comment_id, s])
    );

    return comments.map((c) => {
        const s = statsMap.get(c.comment_id);
        return {
            ...c,
            likes_count: Number(s?.likes_count ?? 0),
            replies_count: Number(s?.replies_count ?? 0),
            liked_by_me: Boolean(s?.liked_by_me),
        };
    });
}

export function buildCommentTree(
    flatComments: Comment[],
    parentId: string | null = null
): CommentWithReplies[] {
    return flatComments
        .filter((c) => c.parent_comment_id === parentId)
        .map((c) => ({
            ...c,
            replies: buildCommentTree(flatComments, c.comment_id),
        }));
}

export function targetToFilter(target: PublicationTarget): {
    field: 'post_id' | 'fragment_id';
    value: string;
} {
    return target.postId
        ? { field: 'post_id', value: target.postId }
        : { field: 'fragment_id', value: target.fragmentId! };
}
