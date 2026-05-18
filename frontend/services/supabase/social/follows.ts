import { supabase } from "@/lib/supabase/client";
import { parseError } from "../helpers/errors";
import { assertUUID, getAuthUser } from "../helpers/validation";
import { enrichUsersWithRelationship, fetchBlockStatus, fetchRelationshipStatus, notifyFollow } from "./queries";
import { SocialResult, Follow, PaginationParams, SocialUser } from "./types";
import { normalizePagination } from "./helper";

export async function followUser(
  targetUserId: string
): Promise<SocialResult<{ follow: Follow; is_friend: boolean }>> {
  try {
    assertUUID(targetUserId, 'ID de usuario')
    const currentUserId = await getAuthUser()
    if (currentUserId === targetUserId) throw new Error('No puedes seguirte a ti mismo.')
 
    const blocks = await fetchBlockStatus(currentUserId, targetUserId)
    if (blocks.a_blocked_b) throw new Error('Has bloqueado a este usuario.')
    if (blocks.b_blocked_a) throw new Error('No puedes seguir a este usuario.')
 
    const { data, error } = await supabase
      .from('follows')
      .insert({ follower_id: currentUserId, following_id: targetUserId })
      .select()
      .single()
 
    if (error) throw error
 
    // Verificar si el target ya nos seguía 
    const { data: mutual } = await supabase
      .from('follows')
      .select('follow_id')
      .eq('follower_id', targetUserId)
      .eq('following_id', currentUserId)
      .maybeSingle()
 
    notifyFollow(currentUserId, targetUserId)
 
    return { data: { follow: data as Follow, is_friend: !!mutual }, error: null }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}

//Dejar de seguir al usuario
export async function unfollowUser(
  targetUserId: string
): Promise<SocialResult> {
  try {
    assertUUID(targetUserId, 'ID de usuario')
    const currentUserId = await getAuthUser()
 
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUserId)
 
    if (error) throw error
    return { data: null, error: null }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}

export async function toggleFollow(
  targetUserId: string
): Promise<SocialResult<{ following: boolean; is_friend: boolean }>> {
  try {
    assertUUID(targetUserId, 'ID de usuario')
    const currentUserId = await getAuthUser()
 
    const status = await fetchRelationshipStatus(currentUserId, targetUserId)
 
    if (status.is_blocked) throw new Error('Has bloqueado a este usuario.')
    if (status.blocked_me) throw new Error('No puedes seguir a este usuario.')
 
    if (status.i_follow_them) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
 
      if (error) throw error
      return { data: { following: false, is_friend: false }, error: null }
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: currentUserId, following_id: targetUserId })
 
      if (error) throw error
      notifyFollow(currentUserId, targetUserId)
 
      return {
        data:  { following: true, is_friend: status.they_follow_me },
        error: null,
      }
    }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}

//Verifica si el usuario actual sigue a otro
export async function isFollowing(
  targetUserId: string
): Promise<SocialResult<boolean>> {
  try {
    assertUUID(targetUserId, 'ID de usuario')
    const currentUserId = await getAuthUser()
 
    const { data } = await supabase
      .from('follows')
      .select('follow_id')
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUserId)
      .maybeSingle()
 
    return { data: !!data, error: null }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}

export async function getFollowing(
  userId:        string,
  currentUserId: string,
  params:        PaginationParams = {}
): Promise<SocialResult<SocialUser[]>> {
  try {
    assertUUID(userId,        'ID de perfil')
    assertUUID(currentUserId, 'ID de usuario')
 
    const { from, to } = normalizePagination(params)
 
    const { data: follows, error } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to)
 
    if (error) throw error
    if (!follows || follows.length === 0) return { data: [], error: null }
 
    const userIds  = follows.map((f: any) => f.following_id)
    const enriched = await enrichUsersWithRelationship(userIds, currentUserId)
 
    return { data: enriched, error: null }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}

export async function getFollowers(
  userId:        string,
  currentUserId: string,
  params:        PaginationParams = {}
): Promise<SocialResult<SocialUser[]>> {
  try {
    assertUUID(userId,        'ID de perfil')
    assertUUID(currentUserId, 'ID de usuario')
 
    const { from, to } = normalizePagination(params)
 
    const { data: follows, error } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('following_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to)
 
    if (error) throw error
    if (!follows || follows.length === 0) return { data: [], error: null }
 
    const userIds  = follows.map((f: any) => f.follower_id)
    const enriched = await enrichUsersWithRelationship(userIds, currentUserId)
 
    return { data: enriched, error: null }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}