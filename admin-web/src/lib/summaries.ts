import { sanctionKinds } from "@/constants/sanctions";
import type { ChartBar, ReasonShare, Sanction, SanctionKind } from "@/types/moderation";

import { countLabel } from "./format";

// textos derivados de los datos que muestran las tarjetas; funciones puras faciles de probar

// variacion del ultimo periodo frente al anterior
export function trendFor(bars: ChartBar[]) {
  if (bars.length < 2) return null;
  const current = bars[bars.length - 1].value;
  const previous = bars[bars.length - 2].value;
  if (previous === 0) return null;

  const change = Math.round((Math.abs(current - previous) / previous) * 100);
  if (change === 0) return { label: "No change from last week", isDrop: false };
  const isDrop = current < previous;
  return { label: `${isDrop ? "↓" : "↑"} ${change}% vs. last week`, isDrop };
}

// frase que destaca los dos motivos con mayor porcentaje
export function highlightFor(reasons: ReasonShare[]) {
  if (reasons.length < 2) return null;
  const [first, second] = [...reasons].sort((a, b) => b.percent - a.percent);
  return `${first.label} and ${second.label.toLowerCase()} make up ${first.percent + second.percent}% of reports.`;
}

// resumen de sanciones por tipo, en orden de gravedad
export function summarizeSanctions(sanctions: Sanction[]) {
  const kinds: SanctionKind[] = ["warning", "suspension", "ban"];
  const parts = kinds
    .map((kind) => ({ kind, count: sanctions.filter((sanction) => sanction.kind === kind).length }))
    .filter(({ count }) => count > 0)
    .map(({ kind, count }) => countLabel(count, sanctionKinds[kind].singular, sanctionKinds[kind].plural));
  return parts.length > 0 ? parts.join(" · ") : "No previous sanctions";
}

// aviso de los reportes que se cierran junto con el actual; null si no hay otros
export function closingNotice(otherPendingCount: number) {
  if (otherPendingCount <= 0) return null;
  return otherPendingCount === 1
    ? "The other pending report for this content will also be closed"
    : `The other ${otherPendingCount} pending reports for this content will also be closed`;
}
