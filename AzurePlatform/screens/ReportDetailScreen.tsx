import { Text, View } from "react-native";

import { AppShell, type ShellProps } from "@/components/layout/AppShell";
import {
  AssignmentCard,
  AuthorHistoryCard,
  CaseSummaryCard,
  RelatedReportsCard,
} from "@/components/reports/CaseContextCards";
import { EvidenceCard } from "@/components/reports/EvidenceCard";
import { ResolutionPanel } from "@/components/reports/ResolutionPanel";
import { StatusChip } from "@/components/reports/StatusChip";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { contentTypes } from "@/constants/content-types";
import type { ReportDetail, Resolution } from "@/types/moderation";

export interface ReportDetailScreenProps {
  shell: ShellProps;
  report: ReportDetail;
  // dia desde el que se cuentan las suspensiones; por defecto hoy
  referenceDate?: Date;
  onBack?: () => void;
  onRevealEvidence?: () => void;
  onTakeCase?: () => void;
  onViewAuthorProfile?: () => void;
  onViewRelated?: () => void;
  onOpenReport?: (reportId: string) => void;
  onResolve?: (resolution: Resolution) => void;
}

export function ReportDetailScreen({
  shell,
  report,
  referenceDate,
  onBack,
  onRevealEvidence,
  onTakeCase,
  onViewAuthorProfile,
  onViewRelated,
  onOpenReport,
  onResolve,
}: ReportDetailScreenProps) {
  const { content } = report;
  const contentLabel = contentTypes[report.contentType].label;
  // en revision se resuelve; en cualquier otro estado solo se consulta el contexto
  const isInReview = report.status === "in_review";
  const title = `Reporte ${report.code}`;

  const evidence = (
    <EvidenceCard
      contentType={report.contentType}
      content={content}
      reporterHandle={report.reporterHandle}
      statement={report.statement}
      onReveal={onRevealEvidence}
    />
  );

  return (
    <AppShell
      {...shell}
      activeSection="reports"
      breadcrumb={`Moderación / Reportes / ${title}`}
      title={title}
      headerActions={
        <Button label="Volver a la cola" variant="ghost" icon="arrow-left" onPress={onBack} />
      }
    >
      <View className="h-8 flex-row items-center gap-3">
        <Chip label={report.reason} />
        <Text className="font-spartan text-[15px] leading-[18px] text-ink-light dark:text-ink-dark">
          {contentLabel}
        </Text>
        <Text className="font-spartan text-sm leading-[17px] text-muted-light dark:text-muted-dark">
          {report.reportedAt}
        </Text>
        <StatusChip status={report.status} />
        <View className="flex-1" />
        {report.assignee ? (
          <Text className="font-spartan-bold text-sm leading-[17px] text-ink-light dark:text-ink-dark">
            Asignado a {report.assignee}
          </Text>
        ) : (
          <Text className="font-spartan text-sm leading-[17px] text-muted-light dark:text-muted-dark">
            Sin asignar
          </Text>
        )}
      </View>

      {isInReview ? (
        <View className="flex-row items-start gap-5">
          <View className="min-w-0 flex-[658] gap-4">
            {evidence}
            <CaseSummaryCard
              authorHandle={content.author.handle}
              sanctions={report.authorHistory}
              relatedCount={report.relatedReports.length}
              onViewHistory={onViewAuthorProfile}
              onViewRelated={onViewRelated}
            />
          </View>
          <View className="min-w-0 flex-[450]">
            <ResolutionPanel
              authorHandle={content.author.handle}
              otherPendingCount={
                report.relatedReports.filter((related) => related.status === "pending").length
              }
              referenceDate={referenceDate}
              onSubmit={onResolve}
            />
          </View>
        </View>
      ) : (
        <View className="flex-row items-start gap-5">
          <View className="min-w-0 flex-[678] gap-4">
            {evidence}
            <View className="flex-row items-center gap-2 p-3">
              <Icon name="shield-check" size={18} tone="muted" />
              <Text className="min-w-0 flex-1 font-spartan text-[13px] leading-4 text-muted-light dark:text-muted-dark">
                Revelar evidencia queda registrado en la bitácora. No se notifica al autor.
              </Text>
            </View>
          </View>
          <View className="min-w-0 flex-[430] gap-4">
            {!report.assignee && <AssignmentCard onTakeCase={onTakeCase} />}
            <AuthorHistoryCard
              authorHandle={content.author.handle}
              sanctions={report.authorHistory}
              onViewProfile={onViewAuthorProfile}
            />
            <RelatedReportsCard
              targetDescription={`${contentLabel.toLowerCase()} de ${content.author.handle} en el perfil de ${content.profileOwnerHandle}`}
              reports={report.relatedReports}
              onOpenReport={onOpenReport}
            />
          </View>
        </View>
      )}
    </AppShell>
  );
}
