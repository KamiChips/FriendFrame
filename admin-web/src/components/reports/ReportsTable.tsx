import { Chip } from "@/components/common/Chip";
import { type Column, DataTable } from "@/components/common/DataTable";
import { Icon } from "@/components/common/Icon";
import { UserCell } from "@/components/common/UserCells";
import { contentTypes, reasonSeverity, reportStatuses, severityStyles } from "@/constants/content-types";
import { cn } from "@/lib/utils";
import type { Report, ReportStatus } from "@/types/moderation";

// un caso en revision por otra persona se muestra apagado
export function StatusChip({ status, muted = false }: { status: ReportStatus; muted?: boolean }) {
  const { label, variant } = reportStatuses[status];
  return <Chip label={label} variant={muted ? "neutral" : variant} />;
}

export interface ReportsTableProps {
  reports: Report[];
  totalReports: number;
  // fecha ya formateada, como "8 nov 2026"
  dateLabel: string;
  // filas a resaltar ademas de las nuevas
  highlightedIds?: string[];
  // a partir de cuantos reportes se resalta la cantidad
  highCountFrom?: number;
}

const columns = (highCountFrom: number): Column<Report>[] => [
  {
    key: "date",
    header: "Date ↓",
    width: 90,
    render: (report) => <span className="text-[13px] text-muted-foreground">{report.timeAgo}</span>,
  },
  {
    key: "type",
    header: "Type",
    width: 150,
    render: (report) => (
      <span className="flex items-center gap-2 text-sm">
        <Icon name={contentTypes[report.contentType].icon} size={17} />
        {contentTypes[report.contentType].label}
      </span>
    ),
  },
  {
    key: "reason",
    header: "Reason",
    width: 110,
    render: (report) => <ReasonChip reason={report.reason} />,
  },
  { key: "user", header: "User", width: 205, render: (report) => <UserCell user={report.user} /> },
  {
    key: "count",
    header: "Reports",
    width: 90,
    render: (report) => (
      <span
        className={cn(
          "text-[15px] font-bold",
          report.reportCount >= highCountFrom ? "text-[#FF9B42]" : "text-muted-foreground",
        )}
      >
        {report.reportCount}
      </span>
    ),
  },
  { key: "status", header: "Status", width: 130, render: (report) => <StatusChip status={report.status} /> },
  {
    key: "assignee",
    header: "Assigned to",
    render: (report) =>
      report.assignee ? (
        <span className="text-sm font-bold">{report.assignee}</span>
      ) : (
        <span className="text-sm text-muted-foreground">Unassigned</span>
      ),
  },
];

export function ReportsTable({
  reports,
  totalReports,
  dateLabel,
  highlightedIds = [],
  highCountFrom = 3,
}: ReportsTableProps) {
  return (
    <DataTable
      label="Report queue"
      columns={columns(highCountFrom)}
      rows={reports}
      getRowKey={(report) => report.id}
      isRowHighlighted={(report) => report.isNew === true || highlightedIds.includes(report.id)}
      rowLink={(report) => ({
        to: `/reports/${report.id}`,
        label: `Open report from ${report.user.handle}, ${report.timeAgo}`,
      })}
      footer={
        <div className="flex h-14 items-center px-4 text-[13px] text-muted-foreground">
          Showing {reports.length} of {totalReports} reports · {dateLabel}
        </div>
      }
    />
  );
}

// aviso de cambios en la cola: reportes que llegaron o reportes que se cerraron
export function QueueBanner({ message, onClick }: { message: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 w-full items-center gap-2.5 rounded-[10px] bg-warn-soft px-4 text-left text-[15px] text-on-warn-soft"
    >
      <span role="status" className="flex flex-1 items-center gap-2.5">
        <Icon name="refresh-cw" size={17} className="text-current" />
        {message}
      </span>
      <Icon name="arrow-right" size={17} className="text-current" />
    </button>
  );
}

// motivo con el color de su gravedad; la gravedad tambien se anuncia a lectores de pantalla
export function ReasonChip({ reason }: { reason: string }) {
  const severity = severityStyles[reasonSeverity[reason] ?? "unknown"];
  return <Chip label={reason} variant={severity.variant} title={severity.label} />;
}
