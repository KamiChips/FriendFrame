export interface Like {
  like_id: string
  user_id: string
  post_id: string | null
  fragment_id: string | null
  created_at: string
}
 
export interface AppComment {
  comment_id: string
  user_id: string
  post_id: string | null
  fragment_id: string | null
  parent_comment_id: string | null
  content: string
  created_at: string
  updated_at: string
  author: {
    user_id:string
    username: string
    full_name: string
    profile_pic: string | null
  }
  replies?: CommentWithReplies[]
  replies_count: number
  liked_by_me: boolean
  likes_count: number
}
 
export type CommentWithReplies = AppComment
 
export type PublicationTarget =
  | { postId: string; fragmentId?: never }
  | { fragmentId: string; postId?: never }
 
export interface InteractionResult<T = null> {
  data: T | null
  error: string | null
}
 
export interface GetCommentsParams {
  page?: number
  limit?: number
  include_replies?: boolean
}

export interface CommentStats{
  comment_id: string
  likes_count: number
  replies_count: number
  liked_by_me: boolean
}

export interface ToggleLikeResult{
  liked: boolean
  likes_count: number
}

export const MAX_COMMENT_LENGTH = 1000
export const MAX_PAGE_LIMIT     = 50
export const DEFAULT_LIMIT      = 20