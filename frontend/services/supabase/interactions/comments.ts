import { supabase } from "@/lib/supabase/client"
import { assertTarget, getAuthUser, validateContent, assertUUID, targetToFilter, parseError, attachStatsToComments, buildCommentTree, normalizePagination } from "./helper"
import { AppComment as Comment,PublicationTarget, InteractionResult, CommentWithReplies, DEFAULT_LIMIT, GetCommentsParams } from "./types"

// Agregar comentario a un post o fragmento 
//Y cuando hay un parent comment se crea una respuesta anidada

//Ejemplo
// comentario raiz 
//const {data} = await addComment({postId}, 'Que bonito perro')
//respuesta anidada/ comentario hijo
//const{data} = await addComment({postId}, 'Siii, muy bonito', parentCommentId)
export async function addComment(
  target:           PublicationTarget,
  content:          string,
  parentCommentId?: string
): Promise<InteractionResult<Comment>> {
  try {
    assertTarget(target)
    const currentUserId = await getAuthUser()
    const sanitized     = validateContent(content, 'comentario')
 
    if (parentCommentId) {
      assertUUID(parentCommentId, 'parentCommentId')
 
      // 1 query: obtener el padre y verificar pertenencia simultáneamente
      const { field, value } = targetToFilter(target)
      const { data: parent, error: parentError } = await supabase
        .from('comments')
        .select('comment_id')
        .eq('comment_id', parentCommentId)
        .eq(field, value)   // ← verifica pertenencia en la misma query
        .maybeSingle()
 
      if (parentError) throw parentError
      if (!parent) throw new Error(
        'El comentario padre no existe o no pertenece a esta publicación.'
      )
    }
 
    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id:           currentUserId,
        post_id:           target.postId     ?? null,
        fragment_id:       target.fragmentId ?? null,
        parent_comment_id: parentCommentId   ?? null,
        content:           sanitized,
      })
      .select(`
        *,
        author:users!user_id (
          user_id, username, full_name, profile_pic
        )
      `)
      .single()
 
    if (error) throw error
 
    return {
      data: { ...data, replies_count: 0, liked_by_me: false, likes_count: 0 } as Comment,
      error: null,
    }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}

//Para editar el contenido del comentario
export async function editComment(
  commentId:  string,
  newContent: string
): Promise<InteractionResult<Comment>> {
  try {
    assertUUID(commentId, 'commentId')
    const currentUserId = await getAuthUser()
    const sanitized     = validateContent(newContent, 'comentario')
 
    const { data, error } = await supabase
      .from('comments')
      .update({ content: sanitized })
      .eq('comment_id', commentId)
      .eq('user_id', currentUserId)
      .select(`
        *,
        author:users!user_id (
          user_id, username, full_name, profile_pic
        )
      `)
      .single()
 
    if (error) throw error
    if (!data)  throw new Error('Comentario no encontrado o sin permisos.')
 
    // 1 RPC en lugar de 3 queries para recuperar los conteos
    const base    = { ...data, replies_count: 0, liked_by_me: false, likes_count: 0 } as Comment
    const [withStats] = await attachStatsToComments([base], currentUserId)
 
    return { data: withStats, error: null }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}

export async function deleteComment(commentId: string): Promise<InteractionResult> {
  try {
    assertUUID(commentId, 'commentId')
    const currentUserId = await getAuthUser()
 
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', currentUserId)
 
    if (error) throw error
    return { data: null, error: null }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}

//Devuelve todos los comentarios de un post o fragment 
// Modo default (include_replies: false):
// Solo raíces paginadas. Con replies_count para mostrar "Ver N respuestas".
export async function getComments(
  target:        PublicationTarget,
  currentUserId: string,
  {
    page            = 0,
    limit           = DEFAULT_LIMIT,
    include_replies = false,
  }: GetCommentsParams = {}
): Promise<InteractionResult<CommentWithReplies[]>> {
  try {
    assertTarget(target)
    assertUUID(currentUserId, 'currentUserId')
 
    const { field, value } = targetToFilter(target)
 
    if (include_replies) {
      // Árbol completo: 1 query + 1 RPC
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          author:users!user_id (
            user_id, username, full_name, profile_pic
          )
        `)
        .eq(field, value)
        .order('created_at', { ascending: true })
 
      if (error) throw error
 
      const base     = (data ?? []).map(c => ({
        ...c, replies_count: 0, liked_by_me: false, likes_count: 0,
      })) as Comment[]
 
      // 1 RPC para todos los comentarios del árbol
      const enriched = await attachStatsToComments(base, currentUserId)
      return { data: buildCommentTree(enriched, null), error: null }
 
    } else {
      // Solo raíces paginadas: 1 query + 1 RPC
      const { from, to } = normalizePagination(page, limit)
 
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          author:users!user_id (
            user_id, username, full_name, profile_pic
          )
        `)
        .eq(field, value)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false })
        .range(from, to)
 
      if (error) throw error
 
      const base     = (data ?? []).map(c => ({
        ...c, replies_count: 0, liked_by_me: false, likes_count: 0,
      })) as Comment[]
 
      // 1 RPC para todos sin importar cuántos haya en la página
      const enriched = await attachStatsToComments(base, currentUserId)
      return { data: enriched, error: null }
    }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}

//para ver respuestas directas a un comentario
export async function getReplies(
  parentCommentId: string,
  currentUserId:   string,
  { page = 0, limit = DEFAULT_LIMIT }: { page?: number; limit?: number } = {}
): Promise<InteractionResult<Comment[]>> {
  try {
    assertUUID(parentCommentId, 'parentCommentId')
    assertUUID(currentUserId,   'currentUserId')
 
    const { from, to } = normalizePagination(page, limit)
 
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:users!user_id (
          user_id, username, full_name, profile_pic
        )
      `)
      .eq('parent_comment_id', parentCommentId)
      .order('created_at', { ascending: true })
      .range(from, to)
 
    if (error) throw error
 
    const base     = (data ?? []).map(c => ({
      ...c, replies_count: 0, liked_by_me: false, likes_count: 0,
    })) as Comment[]
 
    const enriched = await attachStatsToComments(base, currentUserId)
    return { data: enriched, error: null }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}

