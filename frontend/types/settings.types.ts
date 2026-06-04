export interface BlockedUser {
  user_id: string;
  full_name: string;
  username: string;
  profile_pic: string | null;
  blocked_at: string;
}

export interface MyPost {
  post_id: string;
  image: string;
  description: string | null;
  account_owner_id: string;
  created_at: string;
  account_owner: {
    username: string;
    profile_pic: string | null;
  };
}

export interface MyFragment {
  fragment_id: string;
  content: string;
  account_owner_id: string;
  created_at: string;
  account_owner: {
    username: string;
    profile_pic: string | null;
  };
}
