import { supabase } from "@/lib/supabase/client"
import { SocialUser, RelationshipStatus, BlockStatus } from "./types"

export async function enrichUsersWithRelationship(
  userIds:       string[],
  currentUserId: string
): Promise<SocialUser[]> {
  if (userIds.length === 0) return []
 
  const { data, error } = await supabase
    .rpc('get_users_with_relationship', {
      user_ids:        userIds,
      current_user_id: currentUserId,
    })
 
  if (error) throw error
  return (data ?? []) as SocialUser[]
}
 
export function notifyFollow(followerId: string, followingId: string): void {
    Promise.resolve(
    supabase
    .from('notifications')
    .insert({ user_id: followingId, type: 'new_follow', actor_id: followerId }))
    .then(() => {}).catch(() => {})
}
 
export async function fetchRelationshipStatus(
  currentUserId: string,
  targetUserId:  string
): Promise<RelationshipStatus> {
  const { data, error } = await supabase
    .rpc('get_relationship_status', {
      current_user_id: currentUserId,
      target_user_id:  targetUserId,
    })
    .single() as {data: RelationshipStatus | null; error: any };
    
 
  if (error) throw error
 
  return {
    i_follow_them: Boolean((data as any).i_follow_them),
    they_follow_me: Boolean((data as any).they_follow_me),
    is_friend: Boolean((data as any).is_friend),
    is_blocked: Boolean((data as any).is_blocked),
    blocked_me:      Boolean((data as any).blocked_me),
  }
}

export async function fetchBlockStatus(
  currentUserId: string,
  targetUserId:  string
): Promise<{ a_blocked_b: boolean; b_blocked_a: boolean }> {
  const { data, error } = await supabase
    .rpc('check_blocks_between', {
      user_a: currentUserId,
      user_b: targetUserId,
    })
    .single() as {data: BlockStatus | null; error: any}
 
  if (error) throw error
  return {
    a_blocked_b: Boolean((data as BlockStatus).a_blocked_b),
    b_blocked_a: Boolean((data as BlockStatus).b_blocked_a),
  }
}