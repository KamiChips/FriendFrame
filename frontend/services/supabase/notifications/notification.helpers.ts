import {
  DEFAULT_LIMIT,
  MAX_PAGE_LIMIT,
  NotificationType,
  VALID_TYPES,
} from "./notification.types";

export function assertNotificationType(
  type: string,
): asserts type is NotificationType {
  if (!VALID_TYPES.has(type as NotificationType))
    throw new Error(`Tipo de notificación inválido: ${type}`);
}

export function normalizePagination(
  page = 0,
  limit = DEFAULT_LIMIT,
): { from: number; to: number } {
  const p = Math.max(0, Math.floor(page));
  const l = Math.min(MAX_PAGE_LIMIT, Math.max(1, Math.floor(limit)));
  return { from: p * l, to: p * l + l - 1 };
}

export const NOTIFICATION_SELECT = `
  notification_id,
  user_id,
  type,
  is_read,
  created_at,
  actor:users!actor_id (
    user_id, username, full_name, profile_pic
  ),
  post:posts!post_id (
    post_id, media, description
  ),
  fragment:fragments!fragment_id (
    fragment_id, content
  ),
  message:messages!message_id (
    message_id, content, chat_id
  )
` as const;
