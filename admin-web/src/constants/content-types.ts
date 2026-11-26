import type { ChipVariant } from "@/components/common/Chip";
import type { IconName } from "@/components/common/Icon";
import type { ContentType, ReportStatus } from "@/types/moderation";

// nombre e icono con que se muestra cada tipo de contenido reportable
export const contentTypes: Record<ContentType, { label: string; icon: IconName }> = {
  post: { label: "Post", icon: "image" },
  fragment: { label: "Fragment", icon: "layers" },
  comment: { label: "Comentario", icon: "message-circle" },
  chat_message: { label: "Mensaje de chat", icon: "messages-square" },
  profile: { label: "Perfil", icon: "user-round" },
};

// etiqueta y estilo de chip de cada estado de reporte
export const reportStatuses: Record<ReportStatus, { label: string; variant: ChipVariant }> = {
  pending: { label: "Pendiente", variant: "neutral" },
  in_review: { label: "En revisión", variant: "info" },
  resolved: { label: "Resuelto", variant: "success" },
};

export type Severity = "high" | "medium" | "low" | "unknown";

// gravedad de cada motivo de reporte; un motivo nuevo sin clasificar se muestra neutro
export const reasonSeverity: Record<string, Severity> = {
  Violencia: "high",
  Desnudez: "high",
  Acoso: "medium",
  Suplantación: "medium",
  Spam: "low",
  Otro: "unknown",
};

export const severityStyles: Record<Severity, { label: string; variant: ChipVariant }> = {
  high: { label: "Gravedad alta", variant: "danger" },
  medium: { label: "Gravedad media", variant: "warning" },
  low: { label: "Gravedad baja", variant: "caution" },
  unknown: { label: "Gravedad sin clasificar", variant: "neutral" },
};
