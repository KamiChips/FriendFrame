import type { IconName } from "@/components/ui/Icon";
import type { ResolutionAction, SanctionKind } from "@/types/moderation";

// como se nombra y se ilustra cada tipo de sancion
export const sanctionKinds: Record<
  SanctionKind,
  { label: string; singular: string; plural: string; icon: IconName }
> = {
  warning: { label: "Advertencia", singular: "advertencia", plural: "advertencias", icon: "message-square-warning" },
  suspension: { label: "Suspensión", singular: "suspensión", plural: "suspensiones", icon: "clock-3" },
  ban: { label: "Baneo", singular: "baneo", plural: "baneos", icon: "shield-ban" },
};

// acciones con que se resuelve un reporte, en el orden en que se ofrecen
export const resolutionActions: {
  key: ResolutionAction;
  label: string;
  submitLabel: string;
  isDestructive?: boolean;
}[] = [
  { key: "dismiss", label: "Descartar", submitLabel: "Descartar reporte" },
  { key: "hide_content", label: "Ocultar contenido", submitLabel: "Ocultar contenido" },
  { key: "warn", label: "Advertir al autor", submitLabel: "Enviar advertencia" },
  { key: "suspend", label: "Suspender autor", submitLabel: "Aplicar suspensión" },
  { key: "ban", label: "Banear autor", submitLabel: "Aplicar baneo", isDestructive: true },
];

// duraciones de suspension ofrecidas, en dias
export const suspensionDurations = [1, 3, 7, 14, 30];
