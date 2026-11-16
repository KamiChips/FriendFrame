import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

import { ScreenState } from "@/components/layout/ScreenState";
import { contentTypeOptions, reasonOptions, reportStatusOptions } from "@/constants/filters";
import { useAsync } from "@/hooks/use-async";
import { useCycle } from "@/hooks/use-cycle";
import { useShell } from "@/hooks/use-shell";
import { countLabel } from "@/lib/format";
import { ReportsQueueScreen } from "@/screens/ReportsQueueScreen";
import { moderation } from "@/services/moderation";

export default function ReportsRoute() {
  // ?mine=1 abre la cola con los casos del moderador actual;
  // ?notice y ?highlight llegan al volver de resolver un reporte
  const params = useLocalSearchParams<{ mine?: string; notice?: string; highlight?: string }>();
  const shell = useShell();
  const status = useCycle(reportStatusOptions);
  const contentType = useCycle(contentTypeOptions);
  const reason = useCycle(reasonOptions);
  const [assignedToMe, setAssignedToMe] = useState(params.mine === "1");
  const [notice, setNotice] = useState(params.notice);
  const [highlightedIds, setHighlightedIds] = useState(params.highlight ? [params.highlight] : []);

  // al volver a una cola ya abierta solo cambian los parametros, no se vuelve a montar
  useEffect(() => {
    if (!params.notice) return;
    setNotice(params.notice);
    setHighlightedIds(params.highlight ? [params.highlight] : []);
  }, [params.notice, params.highlight]);

  const { data, error, isLoading, reload } = useAsync(
    () =>
      moderation.getReports({
        status: status.option.value,
        contentType: contentType.option.value,
        reason: reason.option.value,
        assignedToMe,
      }),
    [status.option, contentType.option, reason.option, assignedToMe],
  );

  if (!shell) return <ScreenState />;

  const filters = { status, contentType, reason };

  return (
    <ReportsQueueScreen
      shell={shell}
      status={error ? "error" : isLoading ? "loading" : "ready"}
      // mientras carga se usa el recuento del menu para no dejar la cabecera vacia
      openCount={data?.openCount ?? shell.sectionCounts?.reports ?? 0}
      filters={{
        status: status.option.label,
        contentType: contentType.option.label,
        reason: reason.option.label,
      }}
      assignedToMe={assignedToMe}
      newReportsCount={data?.newReportsCount ?? 0}
      reports={data?.reports ?? []}
      totalReports={data?.total ?? 0}
      dateLabel={data?.dateLabel ?? ""}
      notice={notice}
      highlightedIds={highlightedIds}
      onOpenFilter={(key) => filters[key].next()}
      onToggleAssignedToMe={setAssignedToMe}
      onClearFilters={() => {
        Object.values(filters).forEach((filter) => filter.reset());
        setAssignedToMe(false);
      }}
      onShowNewReports={async () => {
        // los nuevos siguen resaltados despues de incorporarse
        const newIds = (data?.reports ?? []).filter((report) => report.isNew).map((report) => report.id);
        const count = data?.newReportsCount ?? newIds.length;
        await moderation.markNewReportsSeen();
        setHighlightedIds(newIds);
        setNotice(
          `${countLabel(count, "reporte nuevo incorporado", "reportes nuevos incorporados")} · Cola actualizada`,
        );
        reload();
      }}
      onDismissNotice={() => {
        setNotice(undefined);
        setHighlightedIds([]);
      }}
      onRetry={reload}
      onOpenReport={(reportId) => router.push(`/reports/${reportId}`)}
    />
  );
}
