import type { ChipVariant } from "@/components/common/Chip";
import type { IconName } from "@/components/common/Icon";
import type { ContentType, ReportStatus } from "@/types/moderation";

// nombre e icono con que se muestra cada tipo de contenido reportable
export const contentTypes: Record<ContentType, { label: string; icon: IconName }> = {
  post: { label: "Post", icon: "image" },
  fragment: { label: "Fragment", icon: "layers" },
  comment: { label: "Comment", icon: "message-circle" },
  chat_message: { label: "Chat message", icon: "messages-square" },
  profile: { label: "Profile", icon: "user-round" },
};

// etiqueta y estilo de chip de cada estado de reporte
export const reportStatuses: Record<ReportStatus, { label: string; variant: ChipVariant }> = {
  pending: { label: "Pending", variant: "neutral" },
  in_review: { label: "In review", variant: "info" },
  resolved: { label: "Resolved", variant: "success" },
};

export type Severity = "high" | "medium" | "low" | "unknown";

// gravedad de cada motivo de reporte; un motivo nuevo sin clasificar se muestra neutro
export const reasonSeverity: Record<string, Severity> = {
  Violence: "high",
  Nudity: "high",
  Harassment: "medium",
  Impersonation: "medium",
  Spam: "low",
  Other: "unknown",
};

export const severityStyles: Record<Severity, { label: string; variant: ChipVariant }> = {
  high: { label: "High severity", variant: "danger" },
  medium: { label: "Medium severity", variant: "warning" },
  low: { label: "Low severity", variant: "caution" },
  unknown: { label: "Unclassified severity", variant: "neutral" },
};
