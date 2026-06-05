export interface BlockedUser {
  user_id: string;
  full_name: string;
  username: string;
  profile_pic: string | null;
  blocked_at: string;
}

export interface MyPost {
  post_id: string;
  media: string;
  description: string | null;
  account_owner_id: string;
  created_at: string;
  account_owner: {
    user_id: string;
    username: string;
    full_name: string; // ← añadir
    profile_pic: string | null;
  };
  // Conteos reales
  likes_count: number;
  comments_count: number;
  shares_count: number;
  liked_by_me: boolean;
}

export interface MyFragment {
  fragment_id: string;
  content: string;
  account_owner_id: string;
  created_at: string;
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
