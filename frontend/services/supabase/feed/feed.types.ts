export interface FeedPost {
  id: string; // post_id o fragment_id
  type: "post" | "fragment";
  author_id: string;
  account_owner_id: string;
  // Solo en posts:
  media?: string | null;
  media_type?: "image" | "video";
  description?: string | null;
  // Solo en fragments:
  content?: string;
  created_at: string;
  author: {
    user_id: string;
    username: string;
    full_name: string;
    profile_pic: string | null;
  };
  account_owner: {
    user_id: string;
    username: string;
    full_name: string;
    profile_pic: string | null;
  };
  likes_count: number;
  comments_count: number;
  shares_count: number;
  liked_by_me: boolean;
}

export interface FeedResult {
  data: FeedPost[];
  error: string | null;
  hasMore: boolean;
}

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 50;
