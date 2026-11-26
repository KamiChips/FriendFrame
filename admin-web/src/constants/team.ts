import type { ChipVariant } from "@/components/common/Chip";
import type { IconName } from "@/components/common/Icon";
import type { AuditAction, TeamRole } from "@/types/moderation";

// como se nombra cada accion registrada y con que chip se muestra
export const auditActions: Record<AuditAction, { label: string; variant: ChipVariant }> = {
  took_case: { label: "Took case", variant: "neutral" },
  viewed_evidence: { label: "Viewed evidence", variant: "accent" },
  dismissed_report: { label: "Dismissed report", variant: "neutral" },
  hid_content: { label: "Hid content", variant: "neutral" },
  warned_author: { label: "Warned author", variant: "neutral" },
  suspended_account: { label: "Suspended account", variant: "neutral" },
  banned_account: { label: "Banned account", variant: "danger" },
  restored_account: { label: "Restored account", variant: "neutral" },
  granted_role: { label: "Granted role", variant: "neutral" },
  revoked_role: { label: "Revoked role", variant: "neutral" },
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
    scope: "Reviews reports, applies sanctions, checks the audit log and manages team roles.",
  },
  moderator: {
    label: "Moderator",
    singular: "moderator",
    plural: "moderators",
    variant: "neutral",
    icon: "flag",
    scope: "Reviews evidence and resolves reports. Can't change the team or other members' permissions.",
  },
};
