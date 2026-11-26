import type { IconName } from "@/components/common/Icon";
import type { ResolutionAction, SanctionKind, TimelineKind } from "@/types/moderation";

// como se nombra y se ilustra cada tipo de sancion
export const sanctionKinds: Record<
  SanctionKind,
  { label: string; singular: string; plural: string; icon: IconName }
> = {
  warning: {
    label: "Warning",
    singular: "warning",
    plural: "warnings",
    icon: "message-square-warning",
  },
  suspension: { label: "Suspension", singular: "suspension", plural: "suspensions", icon: "clock-3" },
  ban: { label: "Ban", singular: "ban", plural: "bans", icon: "shield-ban" },
};

// icono de cada evento de la linea de tiempo de una cuenta
export const timelineIcons: Record<TimelineKind, IconName> = {
  warning: sanctionKinds.warning.icon,
  suspension: sanctionKinds.suspension.icon,
  ban: sanctionKinds.ban.icon,
  restoration: "clock-3",
};

// acciones con que se resuelve un reporte, en el orden en que se ofrecen.
// successTitle es el titulo del aviso que confirma la accion
export const resolutionActions: {
  key: ResolutionAction;
  label: string;
  submitLabel: string;
  successTitle: string;
  isDestructive?: boolean;
  // exige notas internas antes de continuar
  requiresNotes?: boolean;
}[] = [
  {
    key: "dismiss",
    label: "Dismiss",
    submitLabel: "Dismiss report",
    successTitle: "Report dismissed",
  },
  {
    key: "hide_content",
    label: "Hide content",
    submitLabel: "Hide content",
    successTitle: "Content hidden",
  },
  {
    key: "warn",
    label: "Warn author",
    submitLabel: "Send warning",
    successTitle: "Warning sent",
  },
  {
    key: "suspend",
    label: "Suspend author",
    submitLabel: "Apply suspension",
    successTitle: "User suspended",
  },
  {
    key: "ban",
    label: "Ban author",
    submitLabel: "Continue with ban",
    successTitle: "User banned",
    isDestructive: true,
    requiresNotes: true,
  },
];

// duraciones de suspension ofrecidas, en dias
export const suspensionDurations = [1, 3, 7, 14, 30];
