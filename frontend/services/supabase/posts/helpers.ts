import { supabase } from "@/lib/supabase/client";
import { Fragment, PaginationParams, Post } from "./types";

export const MAX_PAGE_LIMIT= 50
export const DEFAULT_LIMIT= 20
export const MAX_DESCRIPTION_LENGTH = 2000

export function normalizePagination(params: PaginationParams): { from: number; to: number } {
  const page  = Math.max(0, Math.floor(params.page  ?? 0))
  const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, Math.floor(params.limit ?? DEFAULT_LIMIT)))
  return { from: page * limit, to: page * limit + limit - 1 }
}
 
export function sanitizeDescription(description?: string | null): string | null {
  if (!description) return null
  const trimmed = description.trim()
  if (!trimmed) return null
  if (trimmed.length > MAX_DESCRIPTION_LENGTH)
    throw new Error(`La descripción no puede superar ${MAX_DESCRIPTION_LENGTH} caracteres.`)
  return trimmed
}

export function parseError(err: unknown): string {
  if (!err) return 'Error desconocido'
  const msg = (err as Error).message ?? String(err)
 
  const known: [string, string][] = [
    ['row-level security', 'No tienes permiso para realizar esta acción.'],
    ['violates foreign key','El usuario o perfil no existe.'],
    ['NetworkError', 'Error de red. Verifica tu conexión.'],
    ['Failed to fetch', 'Error de red. Verifica tu conexión.'],
  ]
 
  for (const [key, value] of known) {
    if (msg.includes(key)) return value
  }
 
  if (
    msg.startsWith('No hay sesión') ||
    msg.startsWith('ID') ||
    msg.startsWith('La descripción') ||
    msg.startsWith('El fragment')  ||
    msg.startsWith('No puedes') ||
    msg.startsWith('Solo puedes') ||
    msg.startsWith('Post no') ||
    msg.startsWith('Fragment no') ||
    msg.startsWith('Se necesita')
  ) return msg
 
  return 'Ocurrió un error inesperado.'
}

//verifica la amistad
export async function assertFriendship(
  authorId: string,
  profileOwnerId: string
): Promise<void> {
  if (authorId === profileOwnerId)
    throw new Error('No puedes publicar en tu propio perfil.')
 
  const { data, error } = await supabase
    .rpc('assert_friendship', {
      author_id: authorId,
      profile_owner_id: profileOwnerId,
    }) as { data: boolean | null; error: any }
 
  if (error) throw error
  if (!data) throw new Error('Solo puedes publicar en el perfil de tus amigos.')
}


//conteos de posts y fragments
export async function attachCountsBatch(
  posts: Post[],
  fragments: Fragment[],
  currentUserId: string
): Promise<{
  postsMap: Map<string, { likes_count: number; comments_count: number; shares_count: number; liked_by_me: boolean }>
  fragmentsMap: Map<string, { likes_count: number; comments_count: number; shares_count: number; liked_by_me: boolean }>
}> {
  const postIds = posts.map(p => p.post_id)
  const fragmentIds = fragments.map(f => f.fragment_id)
 
  if (postIds.length === 0 && fragmentIds.length === 0) {
    return { postsMap: new Map(), fragmentsMap: new Map() }
  }
 
  const { data, error } = await supabase
    .rpc('get_publication_counts', {
      post_ids: postIds,
      fragment_ids: fragmentIds,
      current_user_id: currentUserId,
    }) as { data: any[] | null; error: any }
 
  if (error) throw error
 
  const postsMap = new Map<string, any>()
  const fragmentsMap = new Map<string, any>()
 
  ;(data ?? []).forEach(row => {
    const counts = {
      likes_count: Number(row.likes_count ?? 0),
      comments_count: Number(row.comments_count ?? 0),
      shares_count: Number(row.shares_count ?? 0),
      liked_by_me: Boolean(row.liked_by_me),
    }
    if (row.pub_type === 'post') postsMap.set(row.pub_id, counts)
    if (row.pub_type === 'fragment') fragmentsMap.set(row.pub_id, counts)
  })
 
  return { postsMap, fragmentsMap }
}

export async function uploadMediaFile(
  authorId: string,
  uri: string,
  type: 'image' | 'video'
): Promise<string> {
  const response = await fetch(uri)
  const blob = await response.blob()
 
  const ext = type === 'video' ? 'mp4' : 'jpg'
  const filePath = `${authorId}/${Date.now()}.${ext}`
 
  const { error } = await supabase.storage
    .from('post-images')
    .upload(filePath, blob, {
      contentType: type === 'video' ? 'video/mp4' : 'image/jpeg',
      upsert: false,
    })
 
  if (error) throw error
 
  const { data } = supabase.storage.from('post-images').getPublicUrl(filePath)
  return data.publicUrl
}

export async function deleteMediaFile(publicUrl: string): Promise<void> {
  try {
    const marker = '/post-images/'
    const idx = publicUrl.indexOf(marker)
    if (idx === -1) return
    const filePath = publicUrl.slice(idx + marker.length).split('?')[0]
    await supabase.storage.from('post-images').remove([filePath])
  } catch { /* silencioso */ }
}

export function notifyNewPublication(
  profileOwnerId: string,
  actorId: string,
  type: 'new_post' | 'new_fragment',
  refId: string
): void {
  const payload: Record<string, string> = {
    user_id:  profileOwnerId,
    type,
    actor_id: actorId,
  }
  if (type === 'new_post') payload['post_id'] = refId
  if (type === 'new_fragment') payload['fragment_id'] = refId
 
  Promise.resolve(
    supabase.from('notifications').insert(payload)
  ).then(() => {}).catch(() => {})
}