export interface Post{
    post_id: string
    author_id: string
    account_owner_id: string
    image: string
    media_type: 'image' | 'video'
    description: string | null
    created_at: string
    updated_at : string
    author:{
        user_id: string
        username: string
        full_name: string
        profile_pic: string | null
    }
}

export interface Fragment{
    fragment_id: string
    author_id: string
    account_owner_id: string
    content: string
    created_at: string
    updated_at: string
    author:{
        user_id: string
        username:string
        full_name:string
        profile_pic: string|null
    }
}

export interface PostWithCounts extends Post{
    likes_count: number
    comments_count: number
    shares_count: number
    liked_by_me: boolean
}

export interface FragmentWithCounts extends Fragment{
    likes_count: number
    comments_count: number
    shares_count: number
    liked_by_me: boolean    
}

export type FeedItem = 
| ({type: 'post'} & PostWithCounts)
| ({type: 'fragment'} & FragmentWithCounts)

export interface PostResult<T = null>{
    data: T | null
    error: string | null
}

export interface PaginationParams{
    page?: number
    limit?: number
}