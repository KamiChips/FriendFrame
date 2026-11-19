import { Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import type { ChartBar } from "@/types/moderation";

export interface BarChartCardProps {
  title: string;
  subtitle: string;
  // etiqueta de agrupacion mostrada en el chip
  periodLabel: string;
  bars: ChartBar[];
  // texto del resumen: "{summaryPrefix}: {valor} {unit}"
  summaryPrefix?: string;
  unit?: string;
}

// alto del area del grafico y espacio que ocupan las etiquetas de cada columna
const CHART_HEIGHT = 179;
const LABELS_HEIGHT = 43;

// tope de la escala: tres pasos "redondos" que dejan sitio a la barra mas alta y sus etiquetas
function scaleMaxFor(values: number[]) {
  const needed = (Math.max(0, ...values) * CHART_HEIGHT) / (CHART_HEIGHT - LABELS_HEIGHT);
  let magnitude = 1;
  for (;;) {
    for (const base of [1, 2, 5]) {
      const step = base * magnitude;
      if (step * 3 >= needed) return step * 3;
    }
    magnitude *= 10;
  }
}

// variacion del ultimo periodo frente al anterior
function trendFor(bars: ChartBar[]) {
  if (bars.length < 2) return null;
  const current = bars[bars.length - 1].value;
  const previous = bars[bars.length - 2].value;
  if (previous === 0) return null;

  const change = Math.round((Math.abs(current - previous) / previous) * 100);
  if (change === 0) return { label: "Sin cambio frente a la anterior", isDrop: false };
  const isDrop = current < previous;
  return { label: `${isDrop ? "↓" : "↑"} ${change}% frente a la anterior`, isDrop };
}

export function BarChartCard({
  title,
  subtitle,
  periodLabel,
  bars,
  summaryPrefix = "Actual",
  unit = "",
}: BarChartCardProps) {
  const scaleMax = scaleMaxFor(bars.map((bar) => bar.value));
  const ticks = [scaleMax, (scaleMax * 2) / 3, scaleMax / 3, 0];
  const current = bars[bars.length - 1];
  const trend = trendFor(bars);

  return (
    <Card className="min-w-0 gap-4 p-[22px]">
      <View className="flex-row items-start justify-between">
        <View className="gap-[5px]">
          <Text className="font-spartan-bold text-xl leading-6 text-ink-light dark:text-ink-dark">
            {title}
          </Text>
          <Text className="font-spartan text-[13px] leading-4 text-muted-light dark:text-muted-dark">
            {subtitle}
          </Text>
        </View>
        <Chip label={periodLabel} />
      </View>

      <View className="flex-row items-end gap-[14px]" style={{ height: CHART_HEIGHT }}>
        <View className="w-[22px] justify-between" style={{ height: CHART_HEIGHT }}>
          {ticks.map((tick) => (
            <Text
              key={tick}
              className="font-spartan text-[11px] leading-[13px] text-muted-light dark:text-muted-dark"
            >
              {Math.round(tick)}
            </Text>
          ))}
        </View>

        {bars.map((bar, index) => {
          const isCurrent = index === bars.length - 1;

          return (
            <View key={bar.label} className="min-w-0 flex-1 items-center justify-end gap-2">
              <Text className="font-spartan-bold text-xs leading-[14px] text-ink-light dark:text-ink-dark">
                {bar.value}
              </Text>
              {/* en oscuro el periodo actual se resalta con el color de acento */}
              <View
                testID={`bar-${bar.label}`}
                className={`w-[38px] rounded-t-md bg-[#30C2D9] ${isCurrent ? "dark:bg-[#FF9B42]" : "dark:bg-[#115A67]"}`}
                style={{ height: (bar.value / scaleMax) * CHART_HEIGHT }}
              />
              <Text className="font-spartan text-[11px] leading-[13px] text-muted-light dark:text-muted-dark">
                {bar.label}
              </Text>
            </View>
          );
        })}
      </View>

      <View className="h-px bg-line-light dark:bg-line-dark" />

      <View className="flex-row items-start justify-between">
        <Text className="font-spartan text-[13px] leading-4 text-muted-light dark:text-muted-dark">
          {current ? `${summaryPrefix}: ${current.value} ${unit}`.trim() : ""}
        </Text>
        {trend && (
          <Text
            className={`font-spartan text-[13px] leading-4 ${trend.isDrop ? "text-success-light dark:text-success-dark" : "text-muted-light dark:text-muted-dark"}`}
          >
            {trend.label}
          </Text>
        )}
      </View>
    </Card>
  );
}
