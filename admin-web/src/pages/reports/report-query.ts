import type { ReportsSearch } from "@/schemas/search";
import type { ReportQuery } from "@/services/moderation";

// traduce los filtros de la URL a la consulta del servicio. Sin estado se muestran los pendientes
export function toReportQuery(search: ReportsSearch): ReportQuery {
  return {
    status: search.status === "all" ? undefined : (search.status ?? "pending"),
    contentType: search.type,
    reason: search.reason,
    assignedToMe: search.mine === "1",
  };
}
