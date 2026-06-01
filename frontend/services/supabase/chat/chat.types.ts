export interface ChatMember {
  user_id: string;
  full_name: string;
  username: string;
  profile_pic: string | null;
  joined_at: string;
}

export interface Chat {
  chat_id: string;
  is_group: boolean;
  group_name: string | null;
  created_by: string;
  created_at: string;
  members: ChatMember[];
  last_message: {
    content: string;
    sender_id: string;
    created_at: string;
    sender_username: string;
  } | null;
  unread_count: number;
}

export interface Message {
  message_id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender: {
    user_id: string;
    username: string;
    full_name: string;
    profile_pic: string | null;
  };
  shared_post?: {
    post_id: string;
    image: string;
    description: string | null;
    author: { username: string; profile_pic: string | null };
  } | null;
  shared_fragment?: {
    fragment_id: string;
    content: string;
    author: { username: string; profile_pic: string | null };
  } | null;
}

export interface ChatResult<T = null> {
  data: T | null;
  error: string | null;
}

export type ShareTarget =
  | { postId: string; fragmentId?: never }
  | { fragmentId: string; postId?: never };

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export const MAX_PAGE_LIMIT = 50;
export const DEFAULT_MSG_LIMIT = 30;
export const MAX_GROUP_MEMBERS = 50;
export const MAX_SHARE_CHATS = 10;
export const MAX_GROUP_NAME_LEN = 80;
export const MAX_MESSAGE_LEN = 1000;
export const MAX_PREVIEW_LEN = 100;
