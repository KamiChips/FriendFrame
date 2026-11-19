import { resolutionActions } from "@/constants/sanctions";
import { addDays, countLabel, formatDate } from "@/lib/format";
import type { Resolution } from "@/types/moderation";

// "15 nov": dia y mes de la fecha de fin
const shortDate = (date: Date) => formatDate(date).split(" ").slice(0, 2).join(" ");

// aviso de exito y texto del aviso de la cola tras resolver
export function resolutionFeedback(
  resolution: Resolution,
  authorHandle: string,
  closedCount: number,
  today = new Date(),
) {
  const closed = countLabel(closedCount, "reporte cerrado", "reportes cerrados");
  const resolved = countLabel(closedCount, "reporte resuelto", "reportes resueltos");

  if (resolution.action === "suspend" && resolution.suspensionDays) {
    return {
      title: `Usuario suspendido hasta el ${shortDate(addDays(today, resolution.suspensionDays))}`,
      message: `${authorHandle} · ${closed}`,
      notice: `Cola actualizada · ${resolved}`,
    };
  }
  if (resolution.action === "ban") {
    return {
      title: "Usuario baneado",
      message: `${authorHandle} · Acción registrada en bitácora`,
      notice: `Baneo aplicado · ${resolved}`,
    };
  }
  const action = resolutionActions.find((option) => option.key === resolution.action);
  return {
    title: action?.successTitle ?? "Reporte resuelto",
    message: `${authorHandle} · ${closed}`,
    notice: `Cola actualizada · ${resolved}`,
  };
}
