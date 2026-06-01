export type NotificationType =
  | "new_follow"
  | "new_post"
  | "new_fragment"
  | "new_message";

export interface AppNotification {
  notification_id: string;
  user_id: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
  actor: {
    user_id: string;
    username: string;
    full_name: string;
    profile_pic: string | null;
  };
  post?: {
    post_id: string;
    image: string;
    description: string | null;
  } | null;
  fragment?: {
    fragment_id: string;
    content: string;
  } | null;
  message?: {
    message_id: string;
    content: string;
    chat_id: string;
  } | null;
}

export interface NotificationCounts {
  total: number;
  follows: number;
  posts: number;
  messages: number;
}

export interface NotificationsResult<T = null> {
  data: T | null;
  error: string | null;
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  unread_only?: boolean;
}

export const MAX_PAGE_LIMIT = 50;
export const DEFAULT_LIMIT = 30;
export const MAX_BATCH_IDS = 100;
export const VALID_TYPES = new Set<NotificationType>([
  "new_follow",
  "new_post",
  "new_fragment",
  "new_message",
]);
