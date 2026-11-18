import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";

import { ScreenState } from "@/components/layout/ScreenState";
import type { ProfileTab } from "@/components/users/ProfileCards";
import { actionFailedToast } from "@/constants/feedback";
import { useAsync } from "@/hooks/use-async";
import { useShell } from "@/hooks/use-shell";
import { useToast } from "@/hooks/use-toast";
import { ErrorScreen } from "@/screens/ErrorScreen";
import { UserProfileScreen } from "@/screens/UserProfileScreen";
import { moderation } from "@/services/moderation";

export default function UserProfileRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const shell = useShell();
  const showToast = useToast();
  const [activeTab, setActiveTab] = useState<ProfileTab>("timeline");
  const { data: profile, error, reload } = useAsync(() => moderation.getUser(id), [id]);

  if (!shell) return <ScreenState />;
  if (error) {
    return <ErrorScreen shell={shell} kind="unexpected" activeSection="users" onAction={reload} />;
  }
  if (profile === null) {
    return (
      <ErrorScreen
        shell={shell}
        kind="not-found"
        activeSection="users"
        onAction={() => router.replace("/dashboard")}
      />
    );
  }
  if (!profile) return <ScreenState />;

  // guarda la accion y vuelve a pedir el perfil; si falla se avisa sin cambiar nada
  const runAndReload = async (action: () => Promise<void>) => {
    try {
      await action();
      reload();
    } catch {
      showToast(actionFailedToast);
    }
  };

  return (
    <UserProfileScreen
      shell={shell}
      profile={profile}
      activeTab={activeTab}
      onChangeTab={setActiveTab}
      onRestoreAccount={(notes) => {
        // tras restaurar se muestra la linea de tiempo con el nuevo evento
        setActiveTab("timeline");
        runAndReload(() => moderation.restoreAccount(profile.id, notes));
      }}
      onRestoreContent={(contentId) => runAndReload(() => moderation.restoreContent(profile.id, contentId))}
      onOpenReport={(reportId) => router.push(`/reports/${reportId}`)}
      onViewReports={() => router.navigate("/reports")}
    />
  );
}
