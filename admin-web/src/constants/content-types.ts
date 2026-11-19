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
  in_review: { label: "En revisión", variant: "accent" },
  resolved: { label: "Resuelto", variant: "success" },
};
