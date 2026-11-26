import { keepPreviousData, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router";

import { auditQuery, currentUserQuery, teamQuery } from "@/api/queries";
import { Chip } from "@/components/common/Chip";
import { type Column, DataTable } from "@/components/common/DataTable";
import { Spinner, StatePanel } from "@/components/common/Feedback";
import { FilterSelect } from "@/components/common/FilterSelect";
import { Icon } from "@/components/common/Icon";
import { Page } from "@/components/layout/Page";
import { ALL, auditActionOptions, fromOption } from "@/constants/filters";
import { auditActions } from "@/constants/team";
import { type AuditSearch, auditSearchSchema, parseSearch, toSearch } from "@/schemas/search";
import type { AuditEntry } from "@/types/moderation";

import { ErrorPage } from "./ErrorPages";

const columns: Column<AuditEntry>[] = [
  {
    key: "date",
    header: "Date ↓",
    width: 110,
    render: (entry) => (
      <span className="flex flex-col text-[13px] leading-4 text-muted-foreground">
        <span>{entry.date}</span>
        <span>{entry.year}</span>
      </span>
    ),
  },
  {
    key: "moderator",
    header: "Moderator",
    width: 140,
    render: (entry) => <b className="text-sm">{entry.moderator}</b>,
  },
  {
    key: "action",
    header: "Action",
    width: 170,
    render: (entry) => <Chip {...auditActions[entry.action]} />,
  },
  {
    key: "target",
    header: "Target",
    width: 170,
    render: (entry) => <span className="text-sm">{entry.target}</span>,
  },
  {
    key: "report",
    header: "Related report",
    width: 140,
    // no toda accion nace de un reporte, como otorgar un rol
    render: (entry) =>
      entry.report ? (
        <Link to={`/reports/${entry.report.id}`} className="text-sm text-link hover:underline">
          {entry.report.code} ↗
        </Link>
      ) : (
        <span className="text-sm text-link">—</span>
      ),
  },
  {
    key: "notes",
    header: "Notes",
    render: (entry) => <span className="text-sm whitespace-normal text-muted-foreground">{entry.notes}</span>,
  },
];

export default function AuditPage() {
  const { data: currentUser } = useSuspenseQuery(currentUserQuery());
  // la bitacora es solo para admins
  if (currentUser.role !== "admin") return <ErrorPage kind="forbidden" />;
  return <AuditLog />;
}

function AuditLog() {
  const [params, setParams] = useSearchParams();
  const search = parseSearch(auditSearchSchema, params);
  const audit = useQuery({ ...auditQuery(search), placeholderData: keepPreviousData });
  // las opciones de moderador salen del equipo actual
  const { data: team } = useQuery(teamQuery());
  const moderatorOptions = [
    { label: "All", value: ALL },
    ...(team?.members ?? []).map((member) => ({ label: member.handle, value: member.handle })),
  ];
  const update = (changes: Partial<AuditSearch>) => setParams(toSearch({ ...search, ...changes }));

  return (
    <Page
      breadcrumb="Moderation / Audit log"
      title="Audit log"
      actions={<Chip label="Admin only" variant="accent" size="header" />}
      intro="Every decision leaves context. A record of the moderation team's actions."
    >
      <div className="flex flex-wrap items-center gap-3">
        <FilterSelect
          label="Moderator"
          width={215}
          value={search.moderator ?? ALL}
          options={moderatorOptions}
          onChange={(value) => update({ moderator: fromOption(value) })}
        />
        <FilterSelect
          label="Action"
          width={230}
          value={search.action ?? ALL}
          options={auditActionOptions}
          onChange={(value) => update({ action: fromOption(value) as AuditSearch["action"] })}
        />
        {/* el rango de fechas todavia no se puede elegir: se muestra el que cubre el registro */}
        {audit.data && (
          <span className="flex h-11 items-center rounded-xl border border-line bg-surface px-3.5 text-[15px]">
            {audit.data.dateRangeLabel}
          </span>
        )}
        <button type="button" className="text-sm text-link hover:underline" onClick={() => setParams("")}>
          Clear filters
        </button>
        <span className="flex-1" />
        <Icon name="lock-keyhole" className="text-faint" />
        <span className="text-[13px] text-muted-foreground">Read-only log</span>
      </div>

      {audit.isPending ? (
        <Spinner className="min-h-[200px]" />
      ) : audit.isError ? (
        <StatePanel
          title="We couldn't load the audit log"
          description="Check your connection and try again."
          actionLabel="Retry"
          onAction={() => void audit.refetch()}
        />
      ) : (
        <DataTable
          label="Moderation audit log"
          columns={columns}
          rows={audit.data.entries}
          getRowKey={(entry) => entry.id}
          rowHeight={64}
          density="regular"
          footer={
            <p className="flex h-[58px] items-center px-5 text-[13px] text-muted-foreground">
              {audit.data.entries.length} of {audit.data.total} actions · Local time
            </p>
          }
        />
      )}

      <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
        <Icon name="shield-check" size={17} />
        The audit log records who acted, when and why. It doesn't include sensitive personal data.
      </p>
    </Page>
  );
}
