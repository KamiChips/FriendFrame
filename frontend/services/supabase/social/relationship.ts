import { supabase } from "@/lib/supabase/client"
import { RelationshipStatus, SocialResult, SocialUser } from "./types"
import { parseError } from "../helpers/errors"
import { assertUUID, getAuthUser } from "../helpers/validation"
import { fetchRelationshipStatus } from "./queries"


/**
 *  const { data: rel } = await getRelationshipStatus(targetUserId)
 * if (rel?.blocked_me)    return <PerfilOculto />
 * if (rel?.is_friend)     return <BotonesDeAmigo />
 * if (rel?.i_follow_them) return <BotonDejarSeguir />
 */
export async function getRelationshipStatus(
  targetUserId: string
): Promise<SocialResult<RelationshipStatus>> {
  try {
    assertUUID(targetUserId, 'ID de usuario')
    const currentUserId = await getAuthUser()
    const status = await fetchRelationshipStatus(currentUserId, targetUserId)
    return { data: status, error: null }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}

export async function getFriends(
  userId: string
): Promise<SocialResult<SocialUser[]>> {
  try {
    assertUUID(userId, 'ID de usuario')
 
    const { data, error } = await supabase
      .rpc('get_friends', { target_user_id: userId })
 
    if (error) throw error
 
    const friends: SocialUser[] = (data ?? []).map((u: any) => ({
      ...u,
      i_follow_them: true,
      is_friend:     true,
    }))
 
    return { data: friends, error: null }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}