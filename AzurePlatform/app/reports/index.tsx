import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";

import { ScreenState } from "@/components/layout/ScreenState";
import { contentTypeOptions, reasonOptions, reportStatusOptions } from "@/constants/filters";
import { useAsync } from "@/hooks/use-async";
import { useCycle } from "@/hooks/use-cycle";
import { useShell } from "@/hooks/use-shell";
import { ReportsQueueScreen } from "@/screens/ReportsQueueScreen";
import { moderation } from "@/services/moderation";

export default function ReportsRoute() {
  // ?mine=1 abre la cola con los casos del moderador actual
  const { mine } = useLocalSearchParams<{ mine?: string }>();
  const shell = useShell();
  const status = useCycle(reportStatusOptions);
  const contentType = useCycle(contentTypeOptions);
  const reason = useCycle(reasonOptions);
  const [assignedToMe, setAssignedToMe] = useState(mine === "1");

  const { data, error, reload } = useAsync(
    () =>
      moderation.getReports({
        status: status.option.value,
        contentType: contentType.option.value,
        reason: reason.option.value,
        assignedToMe,
      }),
    [status.option, contentType.option, reason.option, assignedToMe],
  );

  if (!shell || !data) return <ScreenState error={error} onRetry={reload} />;

  const filters = { status, contentType, reason };

  return (
    <ReportsQueueScreen
      shell={shell}
      openCount={data.openCount}
      filters={{
        status: status.option.label,
        contentType: contentType.option.label,
        reason: reason.option.label,
      }}
      assignedToMe={assignedToMe}
      newReportsCount={data.newReportsCount}
      reports={data.reports}
      totalReports={data.total}
      dateLabel={data.dateLabel}
      onOpenFilter={(key) => filters[key].next()}
      onToggleAssignedToMe={setAssignedToMe}
      onClearFilters={() => {
        Object.values(filters).forEach((filter) => filter.reset());
        setAssignedToMe(false);
      }}
      onShowNewReports={async () => {
        await moderation.markNewReportsSeen();
        reload();
      }}
      onOpenReport={(reportId) => router.push(`/reports/${reportId}`)}
    />
  );
}
