import { supabase } from "@/lib/supabase/client";
import { assertUUID, getAuthUser } from "../helpers/validation";
import { assertFriendship, attachCountsBatch, MAX_DESCRIPTION_LENGTH, notifyNewPublication, parseError } from "./helpers";
import { PostResult, Fragment, FragmentWithCounts } from "./types";

export async function createFragment(
  profileOwnerId: string,
  content: string
): Promise<PostResult<Fragment>> {
  try {
    assertUUID(profileOwnerId, 'ID de perfil')
 
    const trimmed = content.trim()
    if (!trimmed) throw new Error('El fragment no puede estar vacío.')
    if (trimmed.length > MAX_DESCRIPTION_LENGTH)
      throw new Error(`El fragment no puede superar ${MAX_DESCRIPTION_LENGTH} caracteres.`)
 
    const currentUserId = await getAuthUser()
 
    await assertFriendship(currentUserId, profileOwnerId)
 
    const { data, error } = await supabase
      .from('fragments')
      .insert({
        author_id: currentUserId,
        account_owner_id: profileOwnerId,
        content: trimmed,
      })
      .select(`
        *,
        author:users!author_id (
          user_id, username, full_name, profile_pic
        )
      `)
      .single()
 
    if (error) throw error
 
    notifyNewPublication(profileOwnerId, currentUserId, 'new_fragment', data.fragment_id)
 
    return { data: data as Fragment, error: null }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}

export async function editFragment(
  fragmentId: string,
  newContent: string
): Promise<PostResult<Fragment>> {
  try {
    assertUUID(fragmentId, 'fragmentId')
 
    const trimmed = newContent.trim()
    if (!trimmed) throw new Error('El fragment no puede estar vacío.')
    if (trimmed.length > MAX_DESCRIPTION_LENGTH)
      throw new Error(`El fragment no puede superar ${MAX_DESCRIPTION_LENGTH} caracteres.`)
 
    const currentUserId = await getAuthUser()
 
    const { data, error } = await supabase
      .from('fragments')
      .update({ content: trimmed })
      .eq('fragment_id', fragmentId)
      .eq('author_id', currentUserId)
      .select(`
        *,
        author:users!author_id (
          user_id, username, full_name, profile_pic
        )
      `)
      .single()
 
    if (error) throw error
    if (!data)  throw new Error('Fragment no encontrado o sin permisos.')
 
    return { data: data as Fragment, error: null }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}

export async function deleteFragment(fragmentId: string): Promise<PostResult> {
  try {
    assertUUID(fragmentId, 'fragmentId')
    const currentUserId = await getAuthUser()
 
    const { error } = await supabase
      .from('fragments')
      .delete()
      .eq('fragment_id', fragmentId)
      .eq('author_id', currentUserId)
 
    if (error) throw error
    return { data: null, error: null }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}

export async function getFragmentWithCounts(
  fragmentId: string,
  currentUserId: string
): Promise<PostResult<FragmentWithCounts>> {
  try {
    assertUUID(fragmentId, 'fragmentId')
    assertUUID(currentUserId, 'ID de usuario')
 
    const { data, error } = await supabase
      .from('fragments')
      .select(`
        *,
        author:users!author_id (
          user_id, username, full_name, profile_pic
        )
      `)
      .eq('fragment_id', fragmentId)
      .single()
 
    if (error) throw error
 
    const { fragmentsMap } = await attachCountsBatch(
      [], [data as Fragment], currentUserId
    )
    const counts = fragmentsMap.get(fragmentId) ?? {
      likes_count: 0, comments_count: 0, shares_count: 0, liked_by_me: false,
    }
 
    return { data: { ...(data as Fragment), ...counts }, error: null }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}