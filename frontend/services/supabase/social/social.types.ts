export interface Follow {
  follow_id: string
  follower_id: string
  following_id: string
  created_at: string
}
 
export interface Block {
  block_id: string
  blocker_id: string
  blocked_id: string
  created_at: string
}

export interface BlockStatus{
  a_blocked_b: boolean
  b_blocked_a: boolean
}
 
export interface SocialUser {
  user_id: string
  full_name: string
  username: string
  profile_pic: string | null
  i_follow_them: boolean
  is_friend: boolean
}
 
export interface RelationshipStatus {
  i_follow_them:  boolean
  they_follow_me: boolean
  is_friend: boolean
  is_blocked: boolean
  blocked_me: boolean
}
 
export interface SocialResult<T = null> {
  data: T | null
  error: string | null
}
 
export interface PaginationParams {
  page?: number
  limit?: number
}