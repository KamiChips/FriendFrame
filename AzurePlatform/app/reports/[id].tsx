import { router, useLocalSearchParams } from "expo-router";

import { ScreenState } from "@/components/layout/ScreenState";
import { useAsync } from "@/hooks/use-async";
import { useShell } from "@/hooks/use-shell";
import { ReportDetailScreen } from "@/screens/ReportDetailScreen";
import { moderation } from "@/services/moderation";

export default function ReportDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const shell = useShell();
  const { data: report, error, reload } = useAsync(() => moderation.getReport(id), [id]);

  if (report === null) return <ScreenState notFound />;
  if (!shell || !report) return <ScreenState error={error} onRetry={reload} />;

  // cada accion se guarda y luego se vuelve a pedir el reporte para mostrar su nuevo estado
  const runAndReload = (action: () => Promise<void>) => async () => {
    await action();
    reload();
  };

  return (
    <ReportDetailScreen
      shell={shell}
      report={report}
      onBack={() => router.navigate("/reports")}
      onRevealEvidence={runAndReload(() => moderation.revealEvidence(report.id))}
      onTakeCase={runAndReload(() => moderation.takeCase(report.id))}
      onViewAuthorProfile={async () => {
        const userId = await moderation.findUserIdByHandle(report.content.author.handle);
        if (userId) router.push(`/users/${userId}`);
      }}
      onViewRelated={() => router.navigate("/reports")}
      onOpenReport={(reportId) => router.push(`/reports/${reportId}`)}
      onResolve={async (resolution) => {
        await moderation.resolveReport(report.id, resolution);
        router.navigate("/reports");
      }}
    />
  );
}
