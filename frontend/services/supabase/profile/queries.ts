import { supabase } from "@/lib/supabase/client"
import { parseError } from "../helpers/errors"
import { ProfileResult, FullProfile, UserProfile, ProfileStats, SearchResult } from "./types"
import { computeStats } from "./social"

export async function getProfile(
  targetUserId:  string,
  currentUserId: string
): Promise<ProfileResult<FullProfile>> {
  try {
    const [
      profileRes,
      statsResult,
      iFollowRes,
      theyFollowRes,
      iBlockedRes,
      theyBlockedRes,
    ] = await Promise.all([

        supabase
        .from('users')
        .select('user_id, full_name, username, profile_pic, created_at')
        .eq('user_id', targetUserId)
        .single(),
 
      // Estadísticas del perfil
      computeStats(targetUserId),
 
      //Yo sigo a este usuario?
      supabase
        .from('follows')
        .select('follow_id')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .maybeSingle(),
 
      //Este usuario me sigue a mí?
      supabase
        .from('follows')
        .select('follow_id')
        .eq('follower_id', targetUserId)
        .eq('following_id', currentUserId)
        .maybeSingle(),
 
      //Yo bloqueé a este usuario?
      supabase
        .from('blocks')
        .select('block_id')
        .eq('blocker_id', currentUserId)
        .eq('blocked_id', targetUserId)
        .maybeSingle(),
 
      // ¿Este usuario me bloqueó a mí?
      supabase
        .from('blocks')
        .select('block_id')
        .eq('blocker_id', targetUserId)
        .eq('blocked_id', currentUserId)
        .maybeSingle(),
    ])
 
    if (profileRes.error) throw profileRes.error
 
    const i_follow_them   = !!iFollowRes.data
    const is_following_me = !!theyFollowRes.data
    const is_friend       = i_follow_them && is_following_me
    const is_blocked      = !!iBlockedRes.data
    const blocked_me      = !!theyBlockedRes.data
 
    const fullProfile: FullProfile = {
      ...(profileRes.data as UserProfile),
      stats:           statsResult,
      i_follow_them,
      is_following_me,
      is_friend,
      is_blocked,
      blocked_me,
    }
 
    return { data: fullProfile, error: null }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}

export async function getProfileStats(
  userId: string
): Promise<ProfileResult<ProfileStats>> {
  try {
    const stats = await computeStats(userId)
    return { data: stats, error: null }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}

export async function searchUsers(
  query:         string,
  currentUserId: string,
  limit:         number = 20
): Promise<ProfileResult<SearchResult[]>> {
  try {
    const q = query.trim()
    if (q.length < 2) {
      return { data: [], error: null }
    }
 
    // 1. Obtener IDs de usuarios bloqueados en ambas direcciones
    const [iBlockedRes, blockedMeRes] = await Promise.all([
      supabase
        .from('blocks')
        .select('blocked_id')
        .eq('blocker_id', currentUserId),
      supabase
        .from('blocks')
        .select('blocker_id')
        .eq('blocked_id', currentUserId),
    ])
 
    const blockedIds = [
      ...(iBlockedRes.data ?? []).map((b: any) => b.blocked_id),
      ...(blockedMeRes.data ?? []).map((b: any) => b.blocker_id),
      currentUserId,   // excluirse a sí mismo
    ]
 
    // 2. Búsqueda por username o full_name con ilike (case-insensitive)
    //    Excluye usuarios bloqueados
    const { data, error } = await supabase
      .from('users')
      .select('user_id, full_name, username, profile_pic')
      .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
      .not('user_id', 'in', `(${blockedIds.join(',')})`)
      .limit(limit)
 
    if (error) throw error
 
    // 3. Para cada resultado, obtener estado de relación social
    const results = await Promise.all(
      (data ?? []).map(async (user: any) => {
        const [iFollowRes, theyFollowRes] = await Promise.all([
          supabase
            .from('follows')
            .select('follow_id')
            .eq('follower_id', currentUserId)
            .eq('following_id', user.user_id)
            .maybeSingle(),
          supabase
            .from('follows')
            .select('follow_id')
            .eq('follower_id', user.user_id)
            .eq('following_id', currentUserId)
            .maybeSingle(),
        ])
 
        const i_follow_them = !!iFollowRes.data
        const they_follow   = !!theyFollowRes.data
 
        return {
          ...user,
          i_follow_them,
          is_friend: i_follow_them && they_follow,
        } as SearchResult
      })
    )
 
    return { data: results, error: null }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}

export async function getMyProfile(): Promise<ProfileResult<UserProfile & { stats: ProfileStats }>> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No hay sesión activa.')
 
    const [profileRes, stats] = await Promise.all([
      supabase
        .from('users')
        .select('user_id, full_name, username, email, profile_pic, created_at')
        .eq('user_id', user.id)
        .single(),
      computeStats(user.id),
    ])
 
    if (profileRes.error) throw profileRes.error
 
    return {
      data: {
        ...(profileRes.data as UserProfile),
        stats,
      },
      error: null,
    }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}