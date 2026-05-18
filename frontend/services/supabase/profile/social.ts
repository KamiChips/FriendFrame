import { supabase } from "@/lib/supabase/client"
import { ProfileResult, ProfileStats, SearchResult, UserProfile } from "./types"
import { parseError } from "../helpers/errors"

export async function computeStats(userId: string): Promise<ProfileStats> {
  const [
    followersRes,
    followingRes,
    postsRes,
    fragmentsRes,
    friendsRes,
  ] = await Promise.all([
    // Cuánta gente sigue a este usuario
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId),
 
    // A cuánta gente sigue este usuario
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId),
 
    // Posts publicados EN el perfil (de cualquier autor)
    supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('account_owner_id', userId),
 
    // Fragments publicados EN el perfil (de cualquier autor)
    supabase
      .from('fragments')
      .select('*', { count: 'exact', head: true })
      .eq('account_owner_id', userId),
 
    // Amigos = usuarios que se siguen mutuamente con este usuario
    // Usamos RPC para no hacer un join complejo en el cliente
    supabase.rpc('count_friends', { target_user_id: userId }),
  ])
 
  const followers_count = followersRes.count    ?? 0
  const following_count = followingRes.count    ?? 0
  const posts_count     = postsRes.count        ?? 0
  const fragments_count = fragmentsRes.count    ?? 0
  const friends_count   = friendsRes.data       ?? 0
 
  return {
    followers_count,
    following_count,
    friends_count,
    posts_count,
    fragments_count,
    publications_count: posts_count + fragments_count,
  }
}

export async function getFollowers(
  userId:        string,
  currentUserId: string,
  { page = 0, limit = 30 }: { page?: number; limit?: number } = {}
): Promise<ProfileResult<SearchResult[]>> {
  try {
    const from = page * limit
    const to   = from + limit - 1
 
    const { data, error } = await supabase
      .from('follows')
      .select(`
        follower:users!follower_id (
          user_id, full_name, username, profile_pic
        )
      `)
      .eq('following_id', userId)
      .range(from, to)
 
    if (error) throw error
 
    // Para cada follower verificar si yo los sigo y si somos amigos
    const results = await Promise.all(
      (data ?? []).map(async (row: any) => {
        const follower = row.follower
 
        const [iFollowRes, theyFollowRes] = await Promise.all([
          supabase
            .from('follows')
            .select('follow_id')
            .eq('follower_id', currentUserId)
            .eq('following_id', follower.user_id)
            .maybeSingle(),
          supabase
            .from('follows')
            .select('follow_id')
            .eq('follower_id', follower.user_id)
            .eq('following_id', currentUserId)
            .maybeSingle(),
        ])
 
        return {
          ...follower,
          i_follow_them: !!iFollowRes.data,
          is_friend:     !!iFollowRes.data && !!theyFollowRes.data,
        } as SearchResult
      })
    )
 
    return { data: results, error: null }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}

export async function getFollowing(
  userId:        string,
  currentUserId: string,
  { page = 0, limit = 30 }: { page?: number; limit?: number } = {}
): Promise<ProfileResult<SearchResult[]>> {
  try {
    const from = page * limit
    const to   = from + limit - 1
 
    const { data, error } = await supabase
      .from('follows')
      .select(`
        following:users!following_id (
          user_id, full_name, username, profile_pic
        )
      `)
      .eq('follower_id', userId)
      .range(from, to)
 
    if (error) throw error
 
    const results = await Promise.all(
      (data ?? []).map(async (row: any) => {
        const followed = row.following
 
        const [iFollowRes, theyFollowRes] = await Promise.all([
          supabase
            .from('follows')
            .select('follow_id')
            .eq('follower_id', currentUserId)
            .eq('following_id', followed.user_id)
            .maybeSingle(),
          supabase
            .from('follows')
            .select('follow_id')
            .eq('follower_id', followed.user_id)
            .eq('following_id', currentUserId)
            .maybeSingle(),
        ])
 
        return {
          ...followed,
          i_follow_them: !!iFollowRes.data,
          is_friend:     !!iFollowRes.data && !!theyFollowRes.data,
        } as SearchResult
      })
    )
 
    return { data: results, error: null }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}

export async function getFriends(
  userId: string
): Promise<ProfileResult<UserProfile[]>> {
  try {
    const { data, error } = await supabase
      .rpc('get_friends', { target_user_id: userId })
 
    if (error) throw error
 
    return { data: data as UserProfile[], error: null }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}