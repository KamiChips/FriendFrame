export interface UserProfile {
  user_id: string
  full_name: string
  username: string
  profile_pic: string | null
  created_at: string
}
 
export interface ProfileStats {
  followers_count: number   // cuánta gente te sigue
  following_count: number   // a cuánta gente sigues
  friends_count: number   // seguimiento mutuo
  posts_count: number   // posts publicados en tu perfil
  fragments_count: number   // fragments publicados en tu perfil
  publications_count: number   // posts + fragments (total en tu perfil)
}
 
export interface FullProfile extends UserProfile {
  stats: ProfileStats
  is_following_me: boolean   // el perfil me sigue a mí
  i_follow_them: boolean   // yo sigo al perfil
  is_friend: boolean   // seguimiento mutuo
  is_blocked: boolean   // yo bloqueé a este usuario
  blocked_me: boolean   // este usuario me bloqueó
}
 
export interface SearchResult {
  user_id: string
  full_name: string
  username: string
  profile_pic: string | null
  is_friend: boolean
  i_follow_them: boolean
}
 
export interface ProfileResult<T = null> {
  data:  T | null
  error: string | null
}