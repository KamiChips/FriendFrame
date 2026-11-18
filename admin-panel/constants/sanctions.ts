import type { IconName } from "@/components/ui/Icon";
import type { ResolutionAction, SanctionKind, TimelineKind } from "@/types/moderation";

// como se nombra y se ilustra cada tipo de sancion
export const sanctionKinds: Record<
  SanctionKind,
  { label: string; singular: string; plural: string; icon: IconName }
> = {
  warning: { label: "Advertencia", singular: "advertencia", plural: "advertencias", icon: "message-square-warning" },
  suspension: { label: "Suspensión", singular: "suspensión", plural: "suspensiones", icon: "clock-3" },
  ban: { label: "Baneo", singular: "baneo", plural: "baneos", icon: "shield-ban" },
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
  { key: "dismiss", label: "Descartar", submitLabel: "Descartar reporte", successTitle: "Reporte descartado" },
  { key: "hide_content", label: "Ocultar contenido", submitLabel: "Ocultar contenido", successTitle: "Contenido ocultado" },
  { key: "warn", label: "Advertir al autor", submitLabel: "Enviar advertencia", successTitle: "Advertencia enviada" },
  { key: "suspend", label: "Suspender autor", submitLabel: "Aplicar suspensión", successTitle: "Usuario suspendido" },
  {
    key: "ban",
    label: "Banear autor",
    submitLabel: "Continuar con el baneo",
    successTitle: "Usuario baneado",
    isDestructive: true,
    requiresNotes: true,
  },
];

// duraciones de suspension ofrecidas, en dias
export const suspensionDurations = [1, 3, 7, 14, 30];
