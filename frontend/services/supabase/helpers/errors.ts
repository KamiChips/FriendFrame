export function parseError(err: unknown): string {
    if (!err) return 'Unknown error';
    const msg = (err as Error).message ?? String(err);
    if (msg.includes('No rows found') || msg.includes('PGRST116'))
        return 'User not found.';
    if (msg.includes('row-level security'))
        return 'You do not have permission to perform this action.';
    if (msg.includes('duplicate key') && msg.includes('likes'))
        return 'You already liked this publication.';
    if (msg.includes('violates check constraint'))
        return 'Database validation error.';
    return msg;
}
