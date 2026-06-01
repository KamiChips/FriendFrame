import { PaginationParams } from "./types";

const MAX_PAGE_LIMIT = 50
const DEFAULT_LIMIT  = 30

export function normalizePagination(params: PaginationParams) : {from: number; to: number}{
    const page = Math.max(0, Math.floor(params.page ?? 0));
    const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, Math.floor(params.limit ?? DEFAULT_LIMIT)))

    return{ from: page * limit, to: page * limit + limit - 1}
}

export function parseError(err: unknown): string {
  if (!err) return 'Error desconocido'
  const msg = (err as Error).message ?? String(err)
 
  const map: [string, string][] = [
    ['duplicate key value violates unique constraint "follows', 'Ya sigues a este usuario.'],
    ['duplicate key value violates unique constraint "blocks',  'Ya has bloqueado a este usuario.'],
    ['violates check constraint',  'No puedes realizar esta acción contigo mismo.'],
    ['row-level security', 'No tienes permiso para realizar esta acción.'],
    ['NetworkError', 'Error de red. Verifica tu conexión.'],
    ['Failed to fetch', 'Error de red. Verifica tu conexión.'],
    ['No hay sesión', msg],
    ['No puedes', msg],
    ['Ya sigues', msg],
    ['Ya has bloqueado', msg],
    ['Has bloqueado', msg],
    ['Solo puedes', msg],
    ['ID', msg],
  ]
 
  for (const [key, value] of map) {
    if (msg.includes(key)) return value
  }
 
  return 'Ocurrió un error inesperado.'
}