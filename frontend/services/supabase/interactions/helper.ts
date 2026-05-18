import { supabase } from "@/lib/supabase/client"
import { PublicationTarget, DEFAULT_LIMIT, MAX_PAGE_LIMIT, MAX_COMMENT_LENGTH, CommentWithReplies, AppComment as Comment, Like, CommentStats } from "./types"

export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
 
export function isValidUUID(v: string): boolean {
  return UUID_REGEX.test(v)
}
 
export function assertUUID(v: string, label = 'ID'): void {
  if (!isValidUUID(v)) throw new Error(`${label} inválido.`)
}
 
export function assertTarget(target: PublicationTarget): void {
  const id = target.postId ?? target.fragmentId
  if (!id) throw new Error('Se requiere postId o fragmentId.')
  assertUUID(id, target.postId ? 'postId' : 'fragmentId')
}
 
export function normalizePagination(
  page  = 0,
  limit = DEFAULT_LIMIT
): { from: number; to: number } {
  const p = Math.max(0, Math.floor(page))
  const l = Math.min(MAX_PAGE_LIMIT, Math.max(1, Math.floor(limit)))
  return { from: p * l, to: p * l + l - 1 }
}
 
export function validateContent(content: string, label = 'contenido'): string {
  const trimmed = content.trim()
  if (!trimmed) throw new Error(`El ${label} no puede estar vacío.`)
  if (trimmed.length > MAX_COMMENT_LENGTH)
    throw new Error(`El ${label} no puede superar ${MAX_COMMENT_LENGTH} caracteres.`)
  return trimmed
}
 
export async function getAuthUser(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('No hay sesión activa.')
  return user.id
}
 
export function parseError(err: unknown): string {
  if (!err) return 'Error desconocido'
  const msg = (err as Error).message ?? String(err)
 
  const known: [string, string][] = [
    ['row-level security','No tienes permiso para realizar esta acción.'],
    ['duplicate key value violates unique constraint', 'Ya diste like a esta publicación.'],
    ['violates check constraint','Error de validación.'],
    ['NetworkError','Error de red. Verifica tu conexión.'],
    ['Failed to fetch', 'Error de red. Verifica tu conexión.'],
  ]
 
  for (const [key, value] of known) {
    if (msg.includes(key)) return value
  }
 
  if (
    msg.startsWith('No hay sesión') ||
    msg.startsWith('El comentario') ||
    msg.startsWith('El contenido') ||
    msg.startsWith('Se requiere') ||
    msg.includes('inválido') ||
    msg.includes('no puede') ||
    msg.includes('no existe') ||
    msg.includes('no pertenece')
  ) return msg
 
  return 'Ocurrió un error inesperado.'
}

export async function attachStatsToComments(
  comments: Comment[],
  currentUserId: string
): Promise<Comment[]> {
  if (comments.length === 0) return []
 
  const ids = comments.map(c => c.comment_id)
 
  const { data: stats, error } = await supabase
    .rpc('get_comment_stats', {
      comment_ids:     ids,
      current_user_id: currentUserId,
    })
 
  if (error) throw error
 
  const typedStats = (stats ?? []) as CommentStats[];

  const statsMap = new Map<string, CommentStats>(
    typedStats.map(s => [s.comment_id, s])
  )
 
  return comments.map(c => {
    const s = statsMap.get(c.comment_id)
    return {
      ...c,
      likes_count: Number(s?.likes_count ?? 0),
      replies_count: Number(s?.replies_count ?? 0),
      liked_by_me:   Boolean(s?.liked_by_me),
    }
  })
}
 

export function buildCommentTree(
  flatComments: Comment[],
  parentId:     string | null = null
): CommentWithReplies[] {
  return flatComments
    .filter(c => c.parent_comment_id === parentId)
    .map(c => ({
      ...c,
      replies: buildCommentTree(flatComments, c.comment_id),
    }))
}
 
export function targetToFilter(target: PublicationTarget): {
  field: 'post_id' | 'fragment_id'
  value: string
} {
  return target.postId
    ? { field: 'post_id',     value: target.postId }
    : { field: 'fragment_id', value: target.fragmentId! }
}
 