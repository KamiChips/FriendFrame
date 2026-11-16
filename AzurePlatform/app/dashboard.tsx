import { router } from "expo-router";

import { ScreenState } from "@/components/layout/ScreenState";
import { useAsync } from "@/hooks/use-async";
import { useShell } from "@/hooks/use-shell";
import { DashboardScreen } from "@/screens/DashboardScreen";
import { moderation } from "@/services/moderation";

export default function DashboardRoute() {
  const shell = useShell();
  const { data, error, reload } = useAsync(() => moderation.getDashboard(), []);

  if (!shell || !data) return <ScreenState error={error} onRetry={reload} />;

  return (
    <DashboardScreen
      shell={shell}
      {...data}
      onOpenQueue={() => router.navigate("/reports")}
      onOpenCase={(caseId) => router.push(`/reports/${caseId}`)}
      onViewMyCases={() => router.push("/reports?mine=1")}
    />
  );
}
