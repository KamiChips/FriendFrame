import { z } from "zod";

// filtros que viven en la URL (?status=...), asi un enlace comparte exactamente la vista.
// un valor invalido en la URL se ignora en lugar de romper la pagina

const optional = <T extends z.ZodType>(schema: T) => schema.optional().catch(undefined);

export const reportsSearchSchema = z.object({
  // sin estado se muestran los pendientes; "all" muestra todos
  status: optional(z.enum(["pending", "in_review", "resolved", "all"])),
  type: optional(z.enum(["post", "fragment", "comment", "chat_message", "profile"])),
  reason: optional(z.string().min(1)),
  mine: optional(z.literal("1")),
  // aviso del resultado de la ultima accion y filas a resaltar
  notice: optional(z.string().min(1)),
  highlight: optional(z.string().min(1)),
});
export type ReportsSearch = z.infer<typeof reportsSearchSchema>;

export const usersSearchSchema = z.object({
  q: optional(z.string().min(1)),
  status: optional(z.enum(["active", "suspended", "banned"])),
});
export type UsersSearch = z.infer<typeof usersSearchSchema>;

export const auditSearchSchema = z.object({
  moderator: optional(z.string().min(1)),
  action: optional(
    z.enum([
      "took_case",
      "viewed_evidence",
      "dismissed_report",
      "hid_content",
      "warned_author",
      "suspended_account",
      "banned_account",
      "restored_account",
      "granted_role",
      "revoked_role",
    ]),
  ),
});
export type AuditSearch = z.infer<typeof auditSearchSchema>;

export const profileSearchSchema = z.object({
  tab: optional(z.enum(["timeline", "hidden"])),
});

// lee los parametros de la URL con un esquema
export function parseSearch<T extends z.ZodType>(schema: T, params: URLSearchParams): z.infer<T> {
  return schema.parse(Object.fromEntries(params));
}

// arma la cadena de busqueda omitiendo los valores vacios
export function toSearch(values: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value) params.set(key, value);
  const text = params.toString();
  return text ? `?${text}` : "";
}
