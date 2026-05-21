import { supabase } from "@/lib/supabase/client";
import { assertUUID, getAuthUser } from "../helpers/validation";
import { SocialResult, Block, PaginationParams, SocialUser } from "./types";
import { fetchBlockStatus } from "./queries";
import { normalizePagination, parseError } from "./helper";

export async function blockUser(
  targetUserId: string
): Promise<SocialResult<Block>> {
  try {
    assertUUID(targetUserId, 'ID de usuario')
    const currentUserId = await getAuthUser()
    if (currentUserId === targetUserId) throw new Error('No puedes bloquearte a ti mismo.')
 
    const { data, error } = await supabase
      .from('blocks')
      .insert({ blocker_id: currentUserId, blocked_id: targetUserId })
      .select()
      .single()
 
    if (error) throw error
 
    // Eliminar follows mutuos en paralelo
    await Promise.all([
      supabase.from('follows').delete()
        .eq('follower_id', currentUserId).eq('following_id', targetUserId),
      supabase.from('follows').delete()
        .eq('follower_id', targetUserId).eq('following_id', currentUserId),
    ])
 
    return { data: data as Block, error: null }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}

export async function unblockUser(
  targetUserId: string
): Promise<SocialResult> {
  try {
    assertUUID(targetUserId, 'ID de usuario')
    const currentUserId = await getAuthUser()
 
    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('blocker_id', currentUserId)
      .eq('blocked_id', targetUserId)
 
    if (error) throw error
    return { data: null, error: null }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}

export async function isBlocked(
  targetUserId: string
): Promise<SocialResult<{ i_blocked_them: boolean; they_blocked_me: boolean }>> {
  try {
    assertUUID(targetUserId, 'ID de usuario')
    const currentUserId = await getAuthUser()
 
    const blocks = await fetchBlockStatus(currentUserId, targetUserId)
 
    return {
      data: {
        i_blocked_them:  blocks.a_blocked_b,
        they_blocked_me: blocks.b_blocked_a,
      },
      error: null,
    }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}

export async function getBlockedUsers(
  params: PaginationParams = {}
): Promise<SocialResult<(Pick<SocialUser, 'user_id' | 'full_name' | 'username' | 'profile_pic'> & { blocked_at: string })[]>> {
  try {
    const currentUserId = await getAuthUser()
    const { from, to }  = normalizePagination(params)
 
    const { data, error } = await supabase
      .from('blocks')
      .select(`
        created_at,
        blocked:users!blocked_id (
          user_id, full_name, username, profile_pic
        )
      `)
      .eq('blocker_id', currentUserId)
      .order('created_at', { ascending: false })
      .range(from, to)
 
    if (error) throw error
 
    return {
      data: (data ?? []).map((row: any) => ({
        ...row.blocked,
        blocked_at: row.created_at,
      })),
      error: null,
    }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}