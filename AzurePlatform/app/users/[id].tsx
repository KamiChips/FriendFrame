import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";

import { ScreenState } from "@/components/layout/ScreenState";
import type { ProfileTab } from "@/components/users/ProfileCards";
import { useAsync } from "@/hooks/use-async";
import { useShell } from "@/hooks/use-shell";
import { UserProfileScreen } from "@/screens/UserProfileScreen";
import { moderation } from "@/services/moderation";

export default function UserProfileRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const shell = useShell();
  const [activeTab, setActiveTab] = useState<ProfileTab>("timeline");
  const { data: profile, error, reload } = useAsync(() => moderation.getUser(id), [id]);

  if (profile === null) return <ScreenState notFound />;
  if (!shell || !profile) return <ScreenState error={error} onRetry={reload} />;

  return (
    <UserProfileScreen
      shell={shell}
      profile={profile}
      activeTab={activeTab}
      onChangeTab={setActiveTab}
      onRestoreAccount={async () => {
        await moderation.restoreAccount(profile.id);
        reload();
      }}
      onOpenReport={(reportId) => router.push(`/reports/${reportId}`)}
      onViewReports={() => router.navigate("/reports")}
    />
  );
}
