import type { ChartBar, Metric, ReasonShare, ReviewCase } from "@/types/moderation";

// datos de ejemplo tomados del diseno; los usan las pruebas y el servicio simulado
export const metrics: Metric[] = [
  { id: "open", label: "Reportes abiertos", value: "23", caption: "8 pendientes de asignar", icon: "flag" },
  {
    id: "suspended",
    label: "Usuarios suspendidos",
    value: "5",
    caption: "Suspensiones vigentes",
    icon: "clock-3",
  },
  { id: "banned", label: "Usuarios baneados", value: "2", caption: "Cuentas bloqueadas", icon: "shield-ban" },
  {
    id: "resolution",
    label: "Tiempo de resolución",
    value: "3.4 h",
    caption: "Promedio de los últimos 7 días",
    icon: "timer",
  },
];

export const weeklyReports: ChartBar[] = [
  { label: "Sem. 1", value: 21 },
  { label: "Sem. 2", value: 30 },
  { label: "Sem. 3", value: 26 },
  { label: "Sem. 4", value: 40 },
  { label: "Sem. 5", value: 35 },
  { label: "Sem. 6", value: 44 },
  { label: "Sem. 7", value: 43 },
  { label: "Sem. 8", value: 35 },
];

export const reasons: ReasonShare[] = [
  { label: "Spam", percent: 30 },
  { label: "Acoso", percent: 25 },
  { label: "Desnudez", percent: 17 },
  { label: "Violencia", percent: 12 },
  { label: "Suplantación", percent: 10 },
  { label: "Otro", percent: 6 },
];

export const reviewCases: ReviewCase[] = [
  {
    id: "c-1048",
    code: "FF-1048",
    reason: "Acoso",
    contentType: "Post",
    handle: "@carlos_dev",
    timeAgo: "Hace 12 min",
  },
  {
    id: "c-1042",
    code: "FF-1042",
    reason: "Spam",
    contentType: "Comentario",
    handle: "@luis.fotos",
    timeAgo: "Hace 45 min",
  },
];
