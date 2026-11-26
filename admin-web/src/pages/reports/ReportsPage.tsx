import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";

import { useMarkNewReportsSeen } from "@/api/mutations";
import { reportsQuery, sectionCountsQuery } from "@/api/queries";
import { Chip } from "@/components/common/Chip";
import { StatePanel } from "@/components/common/Feedback";
import { FilterSelect } from "@/components/common/FilterSelect";
import { Page } from "@/components/layout/Page";
import { QueueBanner, ReportsTable } from "@/components/reports/ReportsTable";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ALL, contentTypeOptions, fromOption, reasonOptions, reportStatusOptions } from "@/constants/filters";
import { countLabel } from "@/lib/format";
import { parseSearch, type ReportsSearch, reportsSearchSchema, toSearch } from "@/schemas/search";

import { toReportQuery } from "./report-query";

// filas de carga que ocupan el alto de una pagina de la cola
const SKELETON_ROWS = 8;

export default function ReportsPage() {
  const [params, setParams] = useSearchParams();
  const search = parseSearch(reportsSearchSchema, params);
  // mientras llega la nueva consulta se siguen viendo los resultados anteriores
  const reports = useQuery({ ...reportsQuery(toReportQuery(search)), placeholderData: keepPreviousData });
  const { data: counts } = useQuery(sectionCountsQuery());
  const markSeen = useMarkNewReportsSeen();

  const highlightedIds = search.highlight?.split(",") ?? [];
  const openCount = reports.data?.openCount ?? counts?.reports ?? 0;
  const newCount = reports.data?.newReportsCount ?? 0;

  // cambiar un filtro descarta el aviso de la ultima accion
  const update = (changes: Partial<ReportsSearch>) =>
    setParams(toSearch({ ...search, notice: undefined, highlight: undefined, ...changes }));

  const showNewReports = () => {
    // los nuevos siguen resaltados despues de incorporarse
    const newIds = (reports.data?.reports ?? []).filter((report) => report.isNew).map((report) => report.id);
    markSeen.mutate(undefined, {
      onSuccess: () =>
        update({
          notice: `${countLabel(newCount, "new report added", "new reports added")} · Queue updated`,
          highlight: newIds.join(",") || undefined,
        }),
    });
  };

  // el resultado de la ultima accion va primero; al cerrarlo aparecen los reportes nuevos
  const banner = search.notice
    ? { message: search.notice, onClick: () => update({}) }
    : newCount > 0
      ? {
          message: `${countLabel(newCount, "new report", "new reports")} — click to view`,
          onClick: showNewReports,
        }
      : null;

  return (
    <Page
      breadcrumb="Moderation / Reports"
      title="Reports"
      actions={
        <Chip
          label={openCount > 0 ? `${openCount} open` : "Nothing pending"}
          variant="accent"
          size="header"
        />
      }
      intro="Review, prioritize and assign community reports."
    >
      <div className="flex flex-wrap items-center gap-3">
        <FilterSelect
          label="Status"
          width={204}
          value={search.status ?? "pending"}
          options={reportStatusOptions}
          onChange={(value) =>
            update({ status: value === "pending" ? undefined : (value as ReportsSearch["status"]) })
          }
        />
        <FilterSelect
          label="Type"
          width={172}
          value={search.type ?? ALL}
          options={contentTypeOptions}
          onChange={(value) => update({ type: fromOption(value) as ReportsSearch["type"] })}
        />
        <FilterSelect
          label="Reason"
          width={184}
          value={search.reason ?? ALL}
          options={reasonOptions}
          onChange={(value) => update({ reason: fromOption(value) })}
        />
        <div className="flex items-center gap-2.5">
          <Switch
            id="assigned-to-me"
            checked={search.mine === "1"}
            onCheckedChange={(checked) => update({ mine: checked ? "1" : undefined })}
          />
          <Label htmlFor="assigned-to-me" className="text-sm font-normal">
            Assigned to me
          </Label>
        </div>
        <button type="button" className="text-sm text-link hover:underline" onClick={() => setParams("")}>
          Clear filters
        </button>
      </div>

      {reports.isSuccess && banner && <QueueBanner {...banner} />}

      {reports.isPending ? (
        <div aria-label="Loading reports" className="flex flex-col gap-4">
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <div key={index} className="flex h-9 items-center gap-4">
              <Skeleton className="size-9 rounded-full bg-line" />
              <div className="flex w-[200px] flex-col gap-2">
                <Skeleton className="h-3 w-[170px] bg-line" />
                <Skeleton className="h-2.5 w-[110px] bg-line" />
              </div>
              <Skeleton className="h-6 w-[100px] rounded-full bg-line" />
            </div>
          ))}
        </div>
      ) : reports.isError ? (
        <StatePanel
          title="We couldn't load the reports"
          description="Check your connection and try again. Your cases are still saved."
          actionLabel="Retry"
          onAction={() => void reports.refetch()}
        />
      ) : reports.data.reports.length === 0 ? (
        <StatePanel
          icon="heart-handshake"
          title="No pending reports 🎉"
          description="The community is all caught up. New reports will show up here."
        />
      ) : (
        <ReportsTable
          reports={reports.data.reports}
          totalReports={reports.data.total}
          dateLabel={reports.data.dateLabel}
          highlightedIds={highlightedIds}
        />
      )}
    </Page>
  );
}
