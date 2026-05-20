import { supabase } from "@/lib/supabase/client";
import { assertUUID } from "../helpers/validation";
import { attachCountsBatch, normalizePagination, parseError } from "./helpers";
import { FeedItem, Fragment, PaginationParams, Post, PostResult } from "./types";


//Feed del perfil: posts y fragmentos mezclados

export async function getProfileFeed(
  profileOwnerId: string,
  currentUserId: string,
  params: PaginationParams = {}
): Promise<PostResult<FeedItem[]>> {
  try {
    assertUUID(profileOwnerId, 'ID de perfil')
    assertUUID(currentUserId,  'ID de usuario')
 
    const { from, to } = normalizePagination(params)
 
    // 1. Traer posts y fragments en paralelo
    const [postsRes, fragmentsRes] = await Promise.all([
      supabase
        .from('posts')
        .select(`
          *,
          author:users!author_id (
            user_id, username, full_name, profile_pic
          )
        `)
        .eq('account_owner_id', profileOwnerId)
        .order('created_at', { ascending: false })
        .range(from, to),
 
      supabase
        .from('fragments')
        .select(`
          *,
          author:users!author_id (
            user_id, username, full_name, profile_pic
          )
        `)
        .eq('account_owner_id', profileOwnerId)
        .order('created_at', { ascending: false })
        .range(from, to),
    ])
 
    if (postsRes.error) throw postsRes.error
    if (fragmentsRes.error) throw fragmentsRes.error
 
    const posts = (postsRes.data ?? []) as Post[]
    const fragments = (fragmentsRes.data ?? []) as Fragment[]
 
    if (posts.length === 0 && fragments.length === 0) {
      return { data: [], error: null }
    }
 
    // 2. Conteos en 1 sola RPC para TODOS los items
    const { postsMap, fragmentsMap } = await attachCountsBatch(
      posts, fragments, currentUserId
    )
 
    // 3. Mezclar y ordenar
    const feed: FeedItem[] = [
      ...posts.map(p => ({
        ...p,
        type: 'post' as const,
        ...(postsMap.get(p.post_id) ?? {
          likes_count: 0, comments_count: 0, shares_count: 0, liked_by_me: false,
        }),
      })),
      ...fragments.map(f => ({
        ...f,
        type: 'fragment' as const,
        ...(fragmentsMap.get(f.fragment_id) ?? {
          likes_count: 0, comments_count: 0, shares_count: 0, liked_by_me: false,
        }),
      })),
    ].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
 
    return { data: feed, error: null }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}