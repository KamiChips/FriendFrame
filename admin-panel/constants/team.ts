import type { ChipVariant } from "@/components/ui/Chip";
import type { IconName } from "@/components/ui/Icon";
import type { AuditAction, TeamRole } from "@/types/moderation";

// como se nombra cada accion registrada y con que chip se muestra
export const auditActions: Record<AuditAction, { label: string; variant: ChipVariant }> = {
  took_case: { label: "Tomó caso", variant: "neutral" },
  viewed_evidence: { label: "Vio evidencia", variant: "accent" },
  dismissed_report: { label: "Descartó reporte", variant: "neutral" },
  hid_content: { label: "Ocultó contenido", variant: "neutral" },
  warned_author: { label: "Advirtió al autor", variant: "neutral" },
  suspended_account: { label: "Suspendió cuenta", variant: "neutral" },
  banned_account: { label: "Baneó cuenta", variant: "danger" },
  restored_account: { label: "Restauró cuenta", variant: "neutral" },
  granted_role: { label: "Otorgó rol", variant: "neutral" },
  revoked_role: { label: "Quitó rol", variant: "neutral" },
};

// nombre, alcance e icono de cada rol del equipo
export const teamRoles: Record<
  TeamRole,
  { label: string; singular: string; plural: string; variant: ChipVariant; icon: IconName; scope: string }
> = {
  admin: {
    label: "Admin",
    singular: "admin",
    plural: "admins",
    variant: "accent",
    icon: "shield-check",
    scope: "Revisa reportes, aplica sanciones, consulta la bitácora y gestiona los roles del equipo.",
  },
  moderator: {
    label: "Moderador",
    singular: "moderador",
    plural: "moderadores",
    variant: "neutral",
    icon: "flag",
    scope:
      "Revisa evidencia y resuelve reportes. No puede modificar el equipo ni los permisos de otros miembros.",
  },
};
