import { supabase } from "@/lib/supabase/client";
import { assertTarget, assertUUID, getAuthUser, parseError, targetToFilter } from "./helper";
import { PublicationTarget, InteractionResult, Like, ToggleLikeResult } from "./types";


//operacion de UI/UX
export async function toggleLike(
  target: PublicationTarget
): Promise<InteractionResult<{ liked: boolean; count: number }>> {
  try {
    assertTarget(target)
    const currentUserId = await getAuthUser()
 
    const { data, error } = await supabase
      .rpc('toggle_like', {
        p_user_id: currentUserId,
        p_post_id: target.postId     ?? null,
        p_fragment_id: target.fragmentId ?? null,
      })
      .single() as {data: ToggleLikeResult; error: any}
 
    if (error) throw error
 
    return {
      data: { liked: Boolean(data.liked), count: Number(data.likes_count) },
      error: null,
    }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}

//inserta el like si es una operacion
export async function likePost(postId: string): Promise<InteractionResult<Like>> {
  try {
    assertUUID(postId, 'postId')
    const currentUserId = await getAuthUser()
 
    const { data, error } = await supabase
      .from('likes')
      .insert({ user_id: currentUserId, post_id: postId })
      .select()
      .single()
 
    if (error) throw error
    return { data: data as Like, error: null }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}
 
export async function unlikePost(postId: string): Promise<InteractionResult> {
  try {
    assertUUID(postId, 'postId')
    const currentUserId = await getAuthUser()
 
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', currentUserId)
      .eq('post_id', postId)
 
    if (error) throw error
    return { data: null, error: null }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}

export async function likeFragment(fragmentId: string): Promise<InteractionResult<Like>> {
  try {
    assertUUID(fragmentId, 'fragmentId')
    const currentUserId = await getAuthUser()
 
    const { data, error } = await supabase
      .from('likes')
      .insert({ user_id: currentUserId, fragment_id: fragmentId })
      .select()
      .single()
 
    if (error) throw error
    return { data: data as Like, error: null }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}
 
export async function unlikeFragment(fragmentId: string): Promise<InteractionResult> {
  try {
    assertUUID(fragmentId, 'fragmentId')
    const currentUserId = await getAuthUser()
 
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', currentUserId)
      .eq('fragment_id', fragmentId)
 
    if (error) throw error
    return { data: null, error: null }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}
 
export const toggleLikePost = (postId: string)     => toggleLike({ postId })
export const toggleLikeFragment = (fragmentId: string) => toggleLike({ fragmentId })


//Obtener el listado de personas que le dieron like a un post o fragmento
export async function getLikers(
  target: PublicationTarget,
  limit:  number = 30
): Promise<InteractionResult<{
  user_id: string
  username: string
  full_name: string
  profile_pic: string | null
}[]>> {
  try {
    assertTarget(target)
 
    const safeLimit        = Math.min(100, Math.max(1, Math.floor(limit)))
    const { field, value } = targetToFilter(target)
 
    const { data, error } = await supabase
      .from('likes')
      .select(`
        user:users!user_id (
          user_id, username, full_name, profile_pic
        )
      `)
      .eq(field, value)
      .order('created_at', { ascending: false })
      .limit(safeLimit)
 
    if (error) throw error
 
    return { data: (data ?? []).map((r: any) => r.user), error: null }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}