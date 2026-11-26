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
      breadcrumb="Moderation / Dashboard"
      title="Dashboard"
      actions={
        <Button variant="default" asChild>
          <Link to="/reports">
            View report queue
            <Icon name="arrow-up-right" />
          </Link>
        </Button>
      }
      intro={`Hi, ${data.adminName}. Here's the pulse of the community today, ${data.dateLabel}.`}
    >
      <div className="grid grid-cols-2 gap-4 xl:flex">
        {data.metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      {/* las dos filas comparten proporcion de columnas: 658 y 450 de 1128 */}
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[658fr_450fr]">
        <BarChartCard
          title="A better cared-for community"
          subtitle={`Resolved reports · last ${data.weeklyReports.length} weeks`}
          periodLabel="Weekly"
          bars={data.weeklyReports}
          summaryPrefix="This week"
          unit="reports"
        />
        <DonutChartCard title="What gets reported?" periodLabel="last 7 days" reasons={data.reasons} />
        <ReviewCasesCard cases={data.reviewCases} />
        <GuidanceCard />
      </div>
    </Page>
  );
}
