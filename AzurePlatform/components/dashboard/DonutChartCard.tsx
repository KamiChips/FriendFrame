import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { Card } from "@/components/ui/Card";
import { chartSeries } from "@/constants/palette";
import type { ReasonShare } from "@/types/moderation";

export interface DonutChartCardProps {
  title: string;
  // periodo que cubren los datos, mostrado bajo el total
  periodLabel: string;
  reasons: ReasonShare[];
}

// medidas de la dona en px
const SIZE = 164;
const THICKNESS = 22;
const GAP = 2.5;
const RADIUS = (SIZE - THICKNESS) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// frase que destaca los dos motivos con mayor porcentaje
function highlightFor(reasons: ReasonShare[]) {
  if (reasons.length < 2) return null;
  const [first, second] = [...reasons].sort((a, b) => b.percent - a.percent);
  return `${first.label} y ${second.label.toLowerCase()} concentran el ${first.percent + second.percent}% de los reportes.`;
}

export function DonutChartCard({ title, periodLabel, reasons }: DonutChartCardProps) {
  const total = reasons.reduce((sum, reason) => sum + reason.percent, 0);
  const highlight = highlightFor(reasons);
  const colorAt = (index: number) => chartSeries[index % chartSeries.length];

  // cada segmento es un trazo del circulo: su largo y donde empieza
  let consumed = 0;
  const segments = reasons.map((reason) => {
    const length = total > 0 ? (reason.percent / total) * CIRCUMFERENCE : 0;
    const segment = { length: Math.max(length - GAP, 0), offset: consumed + GAP / 2 };
    consumed += length;
    return segment;
  });

  return (
    <Card className="min-w-0 gap-5 p-[22px]">
      <Text className="font-spartan-bold text-xl leading-6 text-ink-light dark:text-ink-dark">
        {title}
      </Text>

      <View className="flex-row items-center gap-[22px]">
        <View className="items-center justify-center gap-0.5" style={{ width: SIZE, height: SIZE }}>
          <Svg width={SIZE} height={SIZE} style={{ position: "absolute" }}>
            {segments.map((segment, index) => (
              <Circle
                key={reasons[index].label}
                testID="donut-segment"
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={colorAt(index)}
                strokeWidth={THICKNESS}
                strokeDasharray={[segment.length, CIRCUMFERENCE - segment.length]}
                strokeDashoffset={-segment.offset}
                // el trazo empieza arriba y avanza en sentido horario
                transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
              />
            ))}
          </Svg>
          <Text className="font-spartan-bold text-[32px] leading-[38px] text-ink-light dark:text-ink-dark">
            {total}%
          </Text>
          <Text className="font-spartan text-xs leading-[14px] text-muted-light dark:text-muted-dark">
            {periodLabel}
          </Text>
        </View>

        <View className="min-w-0 flex-1 gap-3">
          {reasons.map((reason, index) => (
            <View key={reason.label} className="flex-row items-center gap-2">
              <View className="h-2 w-2 rounded-full" style={{ backgroundColor: colorAt(index) }} />
              <Text className="min-w-0 flex-1 font-spartan text-[13px] leading-4 text-ink-light dark:text-ink-dark">
                {reason.label}
              </Text>
              <Text className="font-spartan-bold text-[13px] leading-4 text-ink-light dark:text-ink-dark">
                {reason.percent}%
              </Text>
            </View>
          ))}
        </View>
      </View>

      {highlight && (
        <Text className="font-spartan text-[13px] leading-4 text-muted-light dark:text-muted-dark">
          {highlight}
        </Text>
      )}
    </Card>
  );
}
