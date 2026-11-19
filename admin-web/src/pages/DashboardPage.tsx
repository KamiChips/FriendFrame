import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "react-router";

import { dashboardQuery } from "@/api/queries";
import { Icon } from "@/components/common/Icon";
import {
  BarChartCard,
  DonutChartCard,
  GuidanceCard,
  MetricCard,
  ReviewCasesCard,
} from "@/components/dashboard/DashboardCards";
import { Page } from "@/components/layout/Page";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { data } = useSuspenseQuery(dashboardQuery());

  return (
    <Page
      breadcrumb="Moderación / Dashboard"
      title="Dashboard"
      actions={
        <Button variant="default" asChild>
          <Link to="/reports">
            Ver cola de reportes
            <Icon name="arrow-up-right" />
          </Link>
        </Button>
      }
      intro={`Hola, ${data.adminName}. Este es el pulso de la comunidad hoy, ${data.dateLabel}.`}
    >
      <div className="grid grid-cols-2 gap-4 xl:flex">
        {data.metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      {/* las dos filas comparten proporcion de columnas: 658 y 450 de 1128 */}
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[658fr_450fr]">
        <BarChartCard
          title="Una comunidad mejor cuidada"
          subtitle={`Reportes resueltos · últimas ${data.weeklyReports.length} semanas`}
          periodLabel="Semanal"
          bars={data.weeklyReports}
          summaryPrefix="Semana actual"
          unit="reportes"
        />
        <DonutChartCard title="¿Qué se reporta?" periodLabel="últimos 7 días" reasons={data.reasons} />
        <ReviewCasesCard cases={data.reviewCases} />
        <GuidanceCard />
      </div>
    </Page>
  );
}
