import { router } from "expo-router";

import { ScreenState } from "@/components/layout/ScreenState";
import { auditActionOptions } from "@/constants/filters";
import { useAsync } from "@/hooks/use-async";
import { useCycle } from "@/hooks/use-cycle";
import { useShell } from "@/hooks/use-shell";
import { AuditLogScreen } from "@/screens/AuditLogScreen";
import { ErrorScreen } from "@/screens/ErrorScreen";
import { moderation } from "@/services/moderation";

export default function AuditRoute() {
  const shell = useShell();
  const action = useCycle(auditActionOptions);
  const team = useAsync(() => moderation.getTeam(), []);
  // las opciones de moderador salen del equipo actual
  const moderatorOptions = [
    { label: "Todos", value: undefined },
    ...(team.data?.members ?? []).map((member) => ({ label: member.handle, value: member.handle })),
  ];
  const moderator = useCycle(moderatorOptions);
  const moderatorOption = moderatorOptions[moderatorOptions.indexOf(moderator.option)] ?? moderatorOptions[0];

  const { data, error, reload } = useAsync(
    () => moderation.getAuditLog({ moderator: moderatorOption.value, action: action.option.value }),
    [moderatorOption.value, action.option],
  );

  if (!shell) return <ScreenState />;
  // la bitacora es solo para admins
  if (shell.currentUser.role !== "admin") {
    return (
      <ErrorScreen
        shell={shell}
        kind="forbidden"
        activeSection="audit"
        onAction={() => router.replace("/dashboard")}
      />
    );
  }
  if (error) {
    return <ErrorScreen shell={shell} kind="unexpected" activeSection="audit" onAction={reload} />;
  }
  if (!data) return <ScreenState />;

  return (
    <AuditLogScreen
      shell={shell}
      filters={{
        moderator: moderatorOption.label,
        action: action.option.label,
        dateRange: data.dateRangeLabel,
      }}
      entries={data.entries}
      totalEntries={data.total}
      onOpenFilter={(key) => {
        if (key === "moderator") moderator.next();
        if (key === "action") action.next();
      }}
      onClearFilters={() => {
        moderator.reset();
        action.reset();
      }}
      onOpenReport={(reportId) => router.push(`/reports/${reportId}`)}
    />
  );
}
