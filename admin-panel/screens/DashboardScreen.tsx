import { Text, View } from "react-native";

import { BarChartCard } from "@/components/dashboard/BarChartCard";
import { DonutChartCard } from "@/components/dashboard/DonutChartCard";
import { GuidanceCard } from "@/components/dashboard/GuidanceCard";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ReviewCasesCard } from "@/components/dashboard/ReviewCasesCard";
import { AppShell, type ShellProps } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import type { ChartBar, Metric, ReasonShare, ReviewCase } from "@/types/moderation";

export interface DashboardScreenProps {
  shell: ShellProps;
  adminName: string;
  // fecha ya formateada, como "8 de noviembre de 2026"
  dateLabel: string;
  metrics: Metric[];
  // reportes resueltos por semana, de la mas antigua a la actual
  weeklyReports: ChartBar[];
  reasons: ReasonShare[];
  reviewCases: ReviewCase[];
  onOpenQueue?: () => void;
  onOpenCase?: (caseId: string) => void;
  onViewMyCases?: () => void;
  onOpenGuide?: () => void;
}

export function DashboardScreen({
  shell,
  adminName,
  dateLabel,
  metrics,
  weeklyReports,
  reasons,
  reviewCases,
  onOpenQueue,
  onOpenCase,
  onViewMyCases,
  onOpenGuide,
}: DashboardScreenProps) {
  return (
    <AppShell
      {...shell}
      activeSection="dashboard"
      breadcrumb="Moderación / Dashboard"
      title="Dashboard"
      headerActions={
        <Button
          label="Ver cola de reportes"
          variant="primary"
          icon="arrow-up-right"
          onPress={onOpenQueue}
        />
      }
    >
      <Text className="font-spartan text-base leading-[19px] text-muted-light dark:text-muted-dark">
        Hola, {adminName}. Este es el pulso de la comunidad hoy, {dateLabel}.
      </Text>

      <View className="flex-row gap-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </View>

      {/* las dos filas comparten proporcion de columnas: 658 y 450 de 1128 */}
      <View className="flex-row items-start gap-5">
        <View className="min-w-0 flex-[658]">
          <BarChartCard
            title="Una comunidad mejor cuidada"
            subtitle={`Reportes resueltos · últimas ${weeklyReports.length} semanas`}
            periodLabel="Semanal"
            bars={weeklyReports}
            summaryPrefix="Semana actual"
            unit="reportes"
          />
        </View>
        <View className="min-w-0 flex-[450]">
          <DonutChartCard title="¿Qué se reporta?" periodLabel="últimos 7 días" reasons={reasons} />
        </View>
      </View>

      <View className="flex-row items-start gap-5">
        <View className="min-w-0 flex-[658]">
          <ReviewCasesCard cases={reviewCases} onOpenCase={onOpenCase} onViewAll={onViewMyCases} />
        </View>
        <View className="min-w-0 flex-[450]">
          <GuidanceCard onOpenGuide={onOpenGuide} />
        </View>
      </View>
    </AppShell>
  );
}
