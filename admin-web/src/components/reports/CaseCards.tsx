import { Link } from "react-router";

import { Chip } from "@/components/common/Chip";
import { Icon } from "@/components/common/Icon";
import { UserAvatar } from "@/components/common/UserAvatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { contentTypes } from "@/constants/content-types";
import { sanctionKinds } from "@/constants/sanctions";
import { countLabel, joinDates } from "@/lib/format";
import { summarizeSanctions } from "@/lib/summaries";
import type { ContentType, RelatedReport, ReportedContent, Sanction } from "@/types/moderation";

import { StatusChip } from "./ReportsTable";

const title = "text-lg leading-[22px] font-bold";
const link = "text-link hover:underline";

const REVEAL_LABEL = "Potentially sensitive content — click to reveal";

export interface EvidenceCardProps {
  contentType: ContentType;
  content: ReportedContent;
  reporterHandle: string;
  statement: string;
  isRevealing?: boolean;
  onReveal: () => void;
  // vuelve a pedir la evidencia cuando su enlace expiro
  onReloadEvidence: () => void;
}

export function EvidenceCard({
  contentType,
  content,
  reporterHandle,
  statement,
  isRevealing,
  onReveal,
  onReloadEvidence,
}: EvidenceCardProps) {
  const evidenceStatus = content.evidenceStatus ?? "available";
  const isVeiled = content.isSensitive && !content.isRevealed;
  const details = [contentTypes[contentType].label, content.postedAt];
  // el feed invertido permite publicar en perfiles ajenos; se senala porque cambia el contexto
  if (content.author.handle !== content.profileOwnerHandle) details.push("Author ≠ profile owner");

  return (
    <Card className="gap-4 p-5">
      <div className="flex items-center gap-2.5">
        <UserAvatar initials={content.author.initials} imageUrl={content.author.avatarUrl} size={38} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-[17px] leading-5 font-bold">Posted by {content.author.handle}</p>
          <p className="text-[15px] leading-[18px]">on {content.profileOwnerHandle}'s profile</p>
        </div>
        <Chip
          variant="success"
          label={
            evidenceStatus === "deleted" ? "Deleted by author" : content.isVisible ? "Visible" : "Hidden"
          }
        />
      </div>

      <p className="text-[13px] leading-4 text-muted-foreground">{details.join(" · ")}</p>

      {evidenceStatus === "expired" ? (
        <div className="flex h-[230px] flex-col items-center justify-center gap-4 rounded-xl bg-soft">
          <p className="text-[22px] leading-[26px]">The evidence link has expired</p>
          <Button variant="ghost" onClick={onReloadEvidence}>
            <Icon name="refresh-cw" />
            Reload
          </Button>
        </div>
      ) : evidenceStatus === "deleted" ? (
        <div className="flex h-[230px] flex-col items-center justify-center gap-2.5">
          <p className="text-[21px] leading-[25px]">The author deleted this post</p>
          <p className="text-[15px] text-muted-foreground">The report and its history are kept.</p>
        </div>
      ) : (
        <div
          data-testid="evidence"
          className="relative flex items-center justify-center overflow-hidden rounded-xl bg-soft"
          style={{ height: isVeiled ? 230 : 185 }}
        >
          {content.mediaUrl && (
            <img
              src={content.mediaUrl}
              alt="Reported evidence"
              className="absolute inset-0 size-full object-cover"
              style={isVeiled ? { filter: "blur(10px)" } : undefined}
            />
          )}

          {isVeiled && (
            <button
              type="button"
              onClick={onReveal}
              disabled={isRevealing}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-[rgba(24,34,64,0.5)] text-white"
            >
              <Icon name="eye-off" size={28} className="text-white" />
              <span className="max-w-[450px] text-base">{REVEAL_LABEL}</span>
            </button>
          )}

          {content.isSensitive && content.isRevealed && (
            <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-[20px] bg-[rgba(24,34,64,0.8)] px-2.5 py-1.5 text-xs text-white">
              <Icon name="eye" size={14} className="text-white" />
              Evidence revealed
            </span>
          )}
        </div>
      )}

      <figure className="flex flex-col gap-[7px] rounded-[10px] bg-soft p-3.5">
        <figcaption className="text-xs text-muted-foreground">REPORTED BY {reporterHandle}</figcaption>
        <blockquote className="text-base">“{statement}”</blockquote>
      </figure>
    </Card>
  );
}

// invitacion a tomar un caso; si ya lo tomo otra persona el boton queda bloqueado
export function AssignmentCard({
  reviewer,
  isTaking,
  onTakeCase,
}: {
  reviewer?: string | null;
  isTaking?: boolean;
  onTakeCase: () => void;
}) {
  return (
    <Card className="gap-3 p-5">
      <h2 className={title}>This case is available</h2>
      <p className="text-sm text-muted-foreground">Take it to review it and apply an action.</p>
      {reviewer ? (
        <Button className="w-full border-0 bg-soft text-ink" disabled>
          <Icon name="hand" />
          In review by {reviewer}
        </Button>
      ) : (
        <Button variant="default" className="w-full" disabled={isTaking} onClick={onTakeCase}>
          <Icon name="hand" />
          Take case
        </Button>
      )}
    </Card>
  );
}

// sanciones previas del autor, una por fila
export function AuthorHistoryCard({
  authorHandle,
  authorHref,
  sanctions,
}: {
  authorHandle: string;
  authorHref?: string;
  sanctions: Sanction[];
}) {
  return (
    <Card className="gap-3.5 p-5">
      <div className="flex items-start justify-between">
        <h2 className={title}>Author history</h2>
        {authorHref && (
          <Link to={authorHref} className={`${link} text-[13px]`}>
            View profile ↗
          </Link>
        )}
      </div>
      <p className="text-sm font-bold">{authorHandle}</p>
      {sanctions.map((sanction) => (
        <div key={sanction.id} className="flex items-center gap-2.5">
          <Icon name={sanctionKinds[sanction.kind].icon} size={18} className="text-on-notice-soft" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-sm">
              {sanctionKinds[sanction.kind].label} · {sanction.detail}
            </p>
            <p className="text-xs text-muted-foreground">{sanction.date}</p>
          </div>
        </div>
      ))}
    </Card>
  );
}

// otros reportes sobre el mismo contenido
export function RelatedReportsCard({
  targetDescription,
  reports,
}: {
  // a que apuntan todos los reportes, como "post de @a en el perfil de @b"
  targetDescription: string;
  reports: RelatedReport[];
}) {
  return (
    <Card className="gap-3 p-5">
      <h2 className={title}>Same content · {countLabel(reports.length, "report", "reports")}</h2>
      <p className="text-[13px] text-muted-foreground">They all target the same {targetDescription}.</p>
      {reports.map((report) => (
        <div key={report.id} className="flex items-center justify-between">
          <div className="flex flex-col gap-[3px]">
            <Link to={`/reports/${report.id}`} className={`${link} text-sm`}>
              {report.code}
            </Link>
            <span className="text-xs text-muted-foreground">{report.reporterHandle}</span>
          </div>
          <StatusChip status={report.status} />
        </div>
      ))}
    </Card>
  );
}

// version compacta de historial y relacionados para cuando el caso ya se esta resolviendo
export function CaseSummaryCard({
  authorHandle,
  authorHref,
  sanctions,
  relatedCount,
}: {
  authorHandle: string;
  authorHref?: string;
  sanctions: Sanction[];
  relatedCount: number;
}) {
  const dates = joinDates(sanctions.map((sanction) => sanction.date));

  return (
    <Card className="gap-3 p-[18px]">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-[5px]">
          <p className="text-[17px] leading-5 font-bold">{summarizeSanctions(sanctions)}</p>
          <p className="text-[13px] text-muted-foreground">
            {[dates, authorHandle].filter(Boolean).join(" · ")}
          </p>
        </div>
        {authorHref && (
          <Link to={authorHref} className={`${link} text-sm`}>
            View history ↗
          </Link>
        )}
      </div>
      <div className="h-px bg-line" />
      <div className="flex items-start justify-between text-sm">
        <p>{countLabel(relatedCount, "report", "reports")} on the same content</p>
        <Link to="/reports?status=all" className={link}>
          View related ↗
        </Link>
      </div>
    </Card>
  );
}
