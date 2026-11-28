import type { Queryable } from '../db/with-user.js';

// Hacer interfaz para los datos de la funcion
export enum REPORT_TARGETS {
    post = "post", 
    fragment = "fragment", 
    comment = "comment", 
    message = "message", 
    profile = "profile"
}

export class HttpError extends Error {
    constructor(public status: number, public code: string) {
        super(code);
    }
}
const notFound = () => new HttpError(404, "NOT_FOUND");

interface ResolveTargetParams {
    tx: Queryable,
    userId: string,
    targetId: string,
    contentType: REPORT_TARGETS,
}

interface ResolvedTarget {
    target: Record<string, unknown>;
    targetOwnerId: string;
}

async function findOne<T>(tx: Queryable, sql: string, params: unknown[]): Promise<T | null> {
    const { rows } = await tx.query<T>(sql, params);
    return rows[0] ?? null;
}

type Owned = { id: string, author_id: string };

// export function resolveTarget(userId, type, id) {}
// return (target, target_owner)
export async function resolveTarget({ 
    tx, userId, targetId, contentType 
} : ResolveTargetParams): Promise<ResolvedTarget> {
    let target: Record<string, unknown>;
    let ownerId: string;

    switch(contentType){
        case REPORT_TARGETS.post:{
            const row = await findOne<Owned>(
                tx, "SELECT id, author_id FROM posts WHERE id = $1", [targetId]);
            if (!row) throw notFound();
            target = row;
            ownerId = row.author_id;
            break;
        }

        case REPORT_TARGETS.fragment:{
            const row = await findOne<Owned>(
                tx, "SELECT id, author_id FROM fragments WHERE id = $1", [targetId]);
            if (!row) throw notFound();
            target = row;
            ownerId = row.author_id;
            break;
        }

        case REPORT_TARGETS.comment:{
            const row = await findOne<Owned>(
                tx, "SELECT id, author_id FROM comments WHERE id = $1", [targetId]);
            if (!row) throw notFound();
            target = row;
            ownerId = row.author_id;
            break;
        }

        case REPORT_TARGETS.message:{
            const msg = await findOne<{
                id: string; chat_id: string; sender_id: string;
                content: string; created_at: string;
            }>(
                tx,
                `SELECT m.id, m.chat_id, m.sender_id, m.content, m.created_at
                    FROM messages m
                    WHERE m.id = $1 AND is_chat_member(m.chat_id, $2)`,
                [targetId, userId]
            );
            if (!msg) throw notFound();
            target = msg;
            ownerId = msg.sender_id;
            break;
        }

        case REPORT_TARGETS.profile:{
            const profile = await findOne<{ id: string }>(
                tx, "SELECT id FROM profiles WHERE id = $1", [targetId]);
            if (!profile) throw notFound();
            target = profile;
            ownerId = profile.id;
            break;
        }

        default: {
            const invaildType: never = contentType;
            throw new HttpError(400, "INVALID_CONTENT_TYPE");
        }
    }

    if (ownerId === userId) throw new HttpError(400, "CANNOT_REPORT_SELF");

    return { target, targetOwnerId: ownerId}
}