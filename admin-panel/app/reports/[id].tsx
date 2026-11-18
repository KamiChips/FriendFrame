import { router, useLocalSearchParams } from "expo-router";

import { ScreenState } from "@/components/layout/ScreenState";
import { actionFailedToast } from "@/constants/feedback";
import { resolutionActions } from "@/constants/sanctions";
import { useAsync } from "@/hooks/use-async";
import { useShell } from "@/hooks/use-shell";
import { useToast } from "@/hooks/use-toast";
import { addDays, countLabel, formatDate } from "@/lib/format";
import { ErrorScreen } from "@/screens/ErrorScreen";
import { ReportDetailScreen } from "@/screens/ReportDetailScreen";
import { moderation } from "@/services/moderation";
import type { Resolution } from "@/types/moderation";

// aviso de exito y texto del aviso de la cola tras resolver
function resolutionFeedback(resolution: Resolution, authorHandle: string, closedCount: number) {
  const closed = countLabel(closedCount, "reporte cerrado", "reportes cerrados");
  const resolved = countLabel(closedCount, "reporte resuelto", "reportes resueltos");
  const action = resolutionActions.find((option) => option.key === resolution.action);

  if (resolution.action === "suspend" && resolution.suspensionDays) {
    // "15 nov": dia y mes de la fecha de fin
    const until = formatDate(addDays(new Date(), resolution.suspensionDays)).split(" ").slice(0, 2).join(" ");
    return {
      toast: { title: `Usuario suspendido hasta el ${until}`, message: `${authorHandle} · ${closed}` },
      notice: `Cola actualizada · ${resolved}`,
    };
  }
  if (resolution.action === "ban") {
    return {
      toast: { title: "Usuario baneado", message: `${authorHandle} · Acción registrada en bitácora` },
      notice: `Baneo aplicado · ${resolved}`,
    };
  }
  return {
    toast: { title: action?.successTitle ?? "Reporte resuelto", message: `${authorHandle} · ${closed}` },
    notice: `Cola actualizada · ${resolved}`,
  };
}

export default function ReportDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const shell = useShell();
  const showToast = useToast();
  const { data: report, error, reload } = useAsync(() => moderation.getReport(id), [id]);

  if (!shell) return <ScreenState />;
  if (error) {
    return <ErrorScreen shell={shell} kind="unexpected" activeSection="reports" onAction={reload} />;
  }
  if (report === null) {
    return (
      <ErrorScreen
        shell={shell}
        kind="not-found"
        activeSection="reports"
        onAction={() => router.replace("/dashboard")}
      />
    );
  }
  if (!report) return <ScreenState />;

  // cada accion se guarda y luego se vuelve a pedir el reporte; si falla se avisa sin cambiar nada
  const runAndReload = (action: () => Promise<void>) => async () => {
    try {
      await action();
      reload();
    } catch {
      showToast(actionFailedToast);
    }
  };

  return (
    <ReportDetailScreen
      shell={shell}
      report={report}
      onBack={() => router.navigate("/reports")}
      onRevealEvidence={runAndReload(() => moderation.revealEvidence(report.id))}
      onReloadEvidence={reload}
      onTakeCase={runAndReload(() => moderation.takeCase(report.id))}
      onViewAuthorProfile={async () => {
        const userId = await moderation.findUserIdByHandle(report.content.author.handle);
        if (userId) router.push(`/users/${userId}`);
      }}
      onViewRelated={() => router.navigate("/reports")}
      onOpenReport={(reportId) => router.push(`/reports/${reportId}`)}
      onResolve={async (resolution) => {
        try {
          const { closedCount } = await moderation.resolveReport(report.id, resolution);
          const feedback = resolutionFeedback(resolution, report.content.author.handle, closedCount);
          showToast({ variant: "success", ...feedback.toast });
          router.navigate({ pathname: "/reports", params: { notice: feedback.notice, highlight: report.id } });
        } catch {
          showToast(actionFailedToast);
        }
      }}
    />
  );
}
