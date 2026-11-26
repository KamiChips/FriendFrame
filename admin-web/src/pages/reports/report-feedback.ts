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
  const closed = countLabel(closedCount, "report closed", "reports closed");
  const resolved = countLabel(closedCount, "report resolved", "reports resolved");

  if (resolution.action === "suspend" && resolution.suspensionDays) {
    return {
      title: `User suspended until ${shortDate(addDays(today, resolution.suspensionDays))}`,
      message: `${authorHandle} · ${closed}`,
      notice: `Queue updated · ${resolved}`,
    };
  }
  if (resolution.action === "ban") {
    return {
      title: "User banned",
      message: `${authorHandle} · Action recorded in the audit log`,
      notice: `Ban applied · ${resolved}`,
    };
  }
  const action = resolutionActions.find((option) => option.key === resolution.action);
  return {
    title: action?.successTitle ?? "Report resolved",
    message: `${authorHandle} · ${closed}`,
    notice: `Queue updated · ${resolved}`,
  };
}
