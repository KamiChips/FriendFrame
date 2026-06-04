import { FeedPost } from "./feed.types";

export function parseError(err: unknown): string {
  if (!err) return "Error desconocido";
  const msg = (err as Error).message ?? String(err);
  if (msg.includes("NetworkError") || msg.includes("Failed to fetch"))
    return "Error de red. Verifica tu conexión.";
  return "No se pudo cargar el feed.";
}

export function mapRow(row: any): FeedPost {
  return {
    id: row.id,
    type: row.pub_type,
    author_id: row.author_id,
    account_owner_id: row.account_owner_id,
    media: row.media ?? null,
    media_type: row.media_type ?? null,
    description: row.description ?? null,
    content: row.content ?? null,
    created_at: row.created_at,
    author: {
      user_id: row.author_id,
      username: row.author_username,
      full_name: row.author_full_name,
      profile_pic: row.author_pic ?? null,
    },
    account_owner: {
      user_id: row.account_owner_id,
      username: row.owner_username,
      full_name: row.owner_full_name,
      profile_pic: row.owner_pic ?? null,
    },
    likes_count: Number(row.likes_count ?? 0),
    comments_count: Number(row.comments_count ?? 0),
    shares_count: Number(row.shares_count ?? 0),
    liked_by_me: Boolean(row.liked_by_me),
  };
}
