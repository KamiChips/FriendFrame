import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { useResolveReport, useRevealEvidence, useTakeCase } from "@/api/mutations";
import { currentUserQuery, reportQuery, userIdByHandleQuery } from "@/api/queries";
import { Icon } from "@/components/common/Icon";
import { Page } from "@/components/layout/Page";
import {
  AssignmentCard,
  AuthorHistoryCard,
  CaseSummaryCard,
  EvidenceCard,
  RelatedReportsCard,
} from "@/components/reports/CaseCards";
import { ReasonChip, StatusChip } from "@/components/reports/ReportsTable";
import { BanDialog, ResolutionPanel, SuspensionDialog } from "@/components/reports/Resolution";
import { Button } from "@/components/ui/button";
import { contentTypes } from "@/constants/content-types";
import { addDays, formatDate } from "@/lib/format";
import { toSearch } from "@/schemas/search";
import type { ReportDetail, Resolution } from "@/types/moderation";

import { resolutionFeedback } from "./report-feedback";

export default function ReportDetailPage() {
  const { reportId = "" } = useParams();
  // el loader ya comprobo que existe: aqui nunca es null
  const reportResult = useSuspenseQuery(reportQuery(reportId));
  const report = reportResult.data as ReportDetail;
  const { data: currentUser } = useSuspenseQuery(currentUserQuery());
  const navigate = useNavigate();
  const takeCase = useTakeCase();
  const reveal = useRevealEvidence();
  const resolve = useResolveReport();

  const { content } = report;
  const author = content.author.handle;
  const { data: authorId } = useQuery(userIdByHandleQuery(author));
  const authorHref = authorId ? `/users/${authorId}` : undefined;

  const contentLabel = contentTypes[report.contentType].label;
  const isInReview = report.status === "in_review";
  // solo quien tomo el caso lo resuelve; los demas consultan el contexto
  const isMine = report.assignee === currentUser.handle;
  const isTakenByOther = isInReview && !isMine;
  const title = `Report ${report.code}`;
  const otherPendingCount = report.relatedReports.filter((related) => related.status === "pending").length;
  const [today] = useState(() => new Date());

  // suspender y banear piden confirmacion antes de aplicarse
  const [pending, setPending] = useState<Resolution | null>(null);

  const apply = (resolution: Resolution) => {
    setPending(null);
    resolve.mutate(
      { reportId: report.id, resolution },
      {
        onSuccess: ({ closedCount }) => {
          const feedback = resolutionFeedback(resolution, author, closedCount, today);
          toast.success(feedback.title, { description: feedback.message });
          navigate(`/reports${toSearch({ notice: feedback.notice, highlight: report.id })}`);
        },
      },
    );
  };

  const submit = (resolution: Resolution) =>
    resolution.action === "suspend" || resolution.action === "ban"
      ? setPending(resolution)
      : apply(resolution);

  const evidence = (
    <EvidenceCard
      contentType={report.contentType}
      content={content}
      reporterHandle={report.reporterHandle}
      statement={report.statement}
      isRevealing={reveal.isPending}
      onReveal={() => reveal.mutate(report.id)}
      onReloadEvidence={() => void reportResult.refetch()}
    />
  );

  return (
    <Page
      breadcrumb={`Moderation / Reports / ${title}`}
      title={title}
      actions={
        <Button variant="ghost" asChild>
          <Link to="/reports">
            <Icon name="arrow-left" />
            Back to queue
          </Link>
        </Button>
      }
    >
      <div className="flex h-8 items-center gap-3">
        <ReasonChip reason={report.reason} />
        <span className="text-[15px]">{contentLabel}</span>
        <span className="text-sm text-muted-foreground">{report.reportedAt}</span>
        <StatusChip status={report.status} muted={isTakenByOther} />
        <span className="flex-1" />
        <span
          className={
            report.assignee && !isTakenByOther ? "text-sm font-bold" : "text-sm text-muted-foreground"
          }
        >
          {report.assignee ? `Assigned to ${report.assignee}` : "Unassigned"}
        </span>
      </div>

      {isInReview && isMine ? (
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[658fr_450fr]">
          <div className="flex min-w-0 flex-col gap-4">
            {evidence}
            <CaseSummaryCard
              authorHandle={author}
              authorHref={authorHref}
              sanctions={report.authorHistory}
              relatedCount={report.relatedReports.length}
            />
          </div>
          <ResolutionPanel
            authorHandle={author}
            otherPendingCount={otherPendingCount}
            referenceDate={today}
            isSubmitting={resolve.isPending}
            onSubmit={submit}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[678fr_430fr]">
          <div className="flex min-w-0 flex-col gap-4">
            {evidence}
            <p className="flex items-center gap-2 p-3 text-[13px] text-muted-foreground">
              <Icon name="shield-check" size={18} />
              Revealing evidence is recorded in the audit log. The author isn't notified.
            </p>
          </div>
          <div className="flex min-w-0 flex-col gap-4">
            {(!report.assignee || isTakenByOther) && (
              <AssignmentCard
                reviewer={isTakenByOther ? report.assignee : null}
                isTaking={takeCase.isPending}
                onTakeCase={() => takeCase.mutate(report.id)}
              />
            )}
            <AuthorHistoryCard
              authorHandle={author}
              authorHref={authorHref}
              sanctions={report.authorHistory}
            />
            <RelatedReportsCard
              targetDescription={`${contentLabel.toLowerCase()} by ${author} on ${content.profileOwnerHandle}'s profile`}
              reports={report.relatedReports}
            />
          </div>
        </div>
      )}

      {pending?.action === "suspend" && pending.suspensionDays !== undefined && (
        <SuspensionDialog
          authorHandle={author}
          days={pending.suspensionDays}
          until={formatDate(addDays(today, pending.suspensionDays))}
          otherPendingCount={otherPendingCount}
          onConfirm={() => apply(pending)}
          onCancel={() => setPending(null)}
        />
      )}
      {pending?.action === "ban" && (
        <BanDialog
          authorHandle={author}
          initialNotes={pending.notes}
          onConfirm={(notes) => apply({ ...pending, notes })}
          onCancel={() => setPending(null)}
        />
      )}
    </Page>
  );
}
