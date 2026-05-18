import { supabase } from "@/lib/supabase/client"

export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
 
export function isValidUUID(v: string): boolean {
  return UUID_REGEX.test(v)
}
 
export function assertUUID(v: string, label = 'ID'): void {
  if (!isValidUUID(v)) throw new Error(`${label} inválido.`)
}
 
export async function getAuthUser(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('No hay sesión activa.')
  return user.id
}