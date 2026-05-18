export function parseError(err: unknown): string {
  if (!err) return 'Error desconocido'
  const msg = (err as Error).message ?? String(err)
  if (msg.includes('No rows found') || msg.includes('PGRST116'))
    return 'Usuario no encontrado.'
  if (msg.includes('row-level security'))
    return 'No tienes permiso para realizar esta acción.'
  if (msg.includes('duplicate key') && msg.includes('likes'))
    return 'Ya diste like a esta publicación.'
  if (msg.includes('violates check constraint'))
    return 'Error de validación en la base de datos.'
  return msg
}