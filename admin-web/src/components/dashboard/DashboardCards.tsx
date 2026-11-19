import { Link } from "react-router";
import { Bar, BarChart, Cell, LabelList, Pie, PieChart, XAxis, YAxis } from "recharts";

import { Chip } from "@/components/common/Chip";
import { Icon } from "@/components/common/Icon";
import { Card } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { highlightFor, trendFor } from "@/lib/summaries";
import type { ChartBar, Metric, ReasonShare, ReviewCase } from "@/types/moderation";

const cardTitle = "text-xl leading-6 font-bold";

export function MetricCard({ metric }: { metric: Metric }) {
  return (
    <Card className="min-w-0 flex-1 gap-3 p-5">
      <div className="flex items-start justify-between">
        <p className="text-[15px] leading-[18px] text-muted-foreground">{metric.label}</p>
        <Icon name={metric.icon} size={21} className="text-brand" />
      </div>
      <p className="text-4xl leading-[43px] font-bold">{metric.value}</p>
      <p className="text-[13px] leading-4 text-muted-foreground">{metric.caption}</p>
    </Card>
  );
}

const barConfig = { value: { label: "Reportes" } } satisfies ChartConfig;

export interface BarChartCardProps {
  title: string;
  subtitle: string;
  periodLabel: string;
  bars: ChartBar[];
  // texto del resumen: "{summaryPrefix}: {valor} {unit}"
  summaryPrefix?: string;
  unit?: string;
}

export function BarChartCard({
  title,
  subtitle,
  periodLabel,
  bars,
  summaryPrefix = "Actual",
  unit = "",
}: BarChartCardProps) {
  const current = bars[bars.length - 1];
  const trend = trendFor(bars);

  return (
    <Card className="min-w-0 gap-4 p-[22px]">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-[5px]">
          <h2 className={cardTitle}>{title}</h2>
          <p className="text-[13px] leading-4 text-muted-foreground">{subtitle}</p>
        </div>
        <Chip label={periodLabel} />
      </div>

      <ChartContainer config={barConfig} className="aspect-auto h-[179px] w-full">
        <BarChart data={bars} margin={{ top: 20, left: -24, right: 0, bottom: 0 }} accessibilityLayer>
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
          <YAxis tickLine={false} axisLine={false} fontSize={11} tickCount={4} allowDecimals={false} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={38}>
            {/* el periodo actual se resalta en oscuro con el color de acento */}
            {bars.map((bar, index) => (
              <Cell key={bar.label} className={index === bars.length - 1 ? "fill-bar-current" : "fill-bar"} />
            ))}
            <LabelList dataKey="value" position="top" className="fill-ink font-bold" fontSize={12} />
          </Bar>
        </BarChart>
      </ChartContainer>

      <div className="h-px bg-line" />

      <div className="flex items-start justify-between text-[13px] leading-4">
        <p className="text-muted-foreground">
          {current ? `${summaryPrefix}: ${current.value} ${unit}`.trim() : ""}
        </p>
        {trend && <p className={trend.isDrop ? "text-success" : "text-muted-foreground"}>{trend.label}</p>}
      </div>
    </Card>
  );
}

const seriesColor = (index: number) => `var(--chart-${(index % 6) + 1})`;

export function DonutChartCard({
  title,
  periodLabel,
  reasons,
}: {
  title: string;
  periodLabel: string;
  reasons: ReasonShare[];
}) {
  const total = reasons.reduce((sum, reason) => sum + reason.percent, 0);
  const highlight = highlightFor(reasons);
  const config = Object.fromEntries(
    reasons.map((reason, index) => [reason.label, { label: reason.label, color: seriesColor(index) }]),
  ) satisfies ChartConfig;

  return (
    <Card className="min-w-0 gap-5 p-[22px]">
      <h2 className={cardTitle}>{title}</h2>

      <div className="flex items-center gap-[22px]">
        <div className="relative size-[164px] shrink-0">
          <ChartContainer config={config} className="aspect-square size-[164px]">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="label" hideLabel />} />
              <Pie
                data={reasons}
                dataKey="percent"
                nameKey="label"
                innerRadius={60}
                outerRadius={82}
                paddingAngle={1}
                startAngle={90}
                endAngle={-270}
                stroke="none"
              >
                {reasons.map((reason, index) => (
                  <Cell key={reason.label} fill={seriesColor(index)} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span className="text-[32px] leading-[38px] font-bold">{total}%</span>
            <span className="text-xs text-muted-foreground">{periodLabel}</span>
          </div>
        </div>

        <ul className="flex min-w-0 flex-1 flex-col gap-3">
          {reasons.map((reason, index) => (
            <li key={reason.label} className="flex items-center gap-2 text-[13px] leading-4">
              <span className="size-2 rounded-full" style={{ backgroundColor: seriesColor(index) }} />
              <span className="min-w-0 flex-1">{reason.label}</span>
              <span className="font-bold">{reason.percent}%</span>
            </li>
          ))}
        </ul>
      </div>

      {highlight && <p className="text-[13px] leading-4 text-muted-foreground">{highlight}</p>}
    </Card>
  );
}

export function ReviewCasesCard({ cases }: { cases: ReviewCase[] }) {
  return (
    <Card className="min-w-0 gap-[15px] p-[22px]">
      <div className="flex items-start justify-between">
        <h2 className={cardTitle}>Mis casos en revisión ({cases.length})</h2>
        <Link to="/reports?status=in_review&mine=1" className="text-sm text-link hover:underline">
          Ver mis casos →
        </Link>
      </div>

      <ul className="flex flex-col gap-[15px]">
        {cases.map((reviewCase) => (
          <li key={reviewCase.id}>
            <Link
              to={`/reports/${reviewCase.id}`}
              aria-label={`Abrir caso ${reviewCase.code}`}
              className="-mx-2 flex items-center gap-[14px] rounded-lg px-2 py-1 hover:bg-soft"
            >
              <Icon name="file-search" size={20} className="text-brand" />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-[15px] leading-[18px]">
                  {[reviewCase.code, reviewCase.reason, reviewCase.contentType].join(" · ")}
                </span>
                <span className="text-[13px] leading-4 font-bold">{reviewCase.handle}</span>
              </span>
              <span className="text-xs text-muted-foreground">{reviewCase.timeAgo}</span>
              <Icon name="arrow-right" className="text-link" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// recordatorio fijo del criterio de moderacion
export function GuidanceCard() {
  return (
    <Card className="min-w-0 gap-3 p-[22px]">
      <Icon name="heart-handshake" size={28} className="text-brand" />
      <h2 className={cardTitle}>Primero, el contexto.</h2>
      <p className="text-[15px] leading-[18px] text-muted-foreground">
        Revisa quién publica y en qué perfil aparece el contenido antes de tomar una decisión.
      </p>
      {/* la guia todavia no tiene pagina: se muestra sin enlace */}
      <span className="text-sm text-link">Consultar guía de moderación ↗</span>
    </Card>
  );
}
