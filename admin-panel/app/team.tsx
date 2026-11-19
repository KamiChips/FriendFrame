import { router } from "expo-router";
import { useState } from "react";

import { ScreenState } from "@/components/layout/ScreenState";
import type { MemberCandidate } from "@/components/team/TeamDialogs";
import { actionFailedToast } from "@/constants/feedback";
import { useAsync } from "@/hooks/use-async";
import { useShell } from "@/hooks/use-shell";
import { useToast } from "@/hooks/use-toast";
import { ErrorScreen } from "@/screens/ErrorScreen";
import { TeamScreen } from "@/screens/TeamScreen";
import { moderation } from "@/services/moderation";

export default function TeamRoute() {
  const shell = useShell();
  const showToast = useToast();
  const [candidate, setCandidate] = useState<MemberCandidate | null>(null);
  const { data, error, reload } = useAsync(() => moderation.getTeam(), []);

  if (!shell) return <ScreenState />;
  // gestionar el equipo es solo para admins
  if (shell.currentUser.role !== "admin") {
    return (
      <ErrorScreen
        shell={shell}
        kind="forbidden"
        activeSection="team"
        onAction={() => router.replace("/dashboard")}
      />
    );
  }
  if (error) {
    return <ErrorScreen shell={shell} kind="unexpected" activeSection="team" onAction={reload} />;
  }
  if (!data) return <ScreenState />;

  const runAndReload = async (action: () => Promise<void>) => {
    try {
      await action();
      reload();
    } catch {
      showToast(actionFailedToast);
    }
  };

  return (
    <TeamScreen
      shell={shell}
      members={data.members}
      lastUpdated={data.lastUpdated}
      candidate={candidate}
      onSearchCandidate={async (query) => {
        const text = query.trim();
        if (!text) return setCandidate(null);
        // primera cuenta que coincide y que todavia no es del equipo
        const { users } = await moderation.getUsers({ query: text });
        const match = users.find((user) => !data.members.some((member) => member.handle === user.handle));
        setCandidate(match ?? null);
      }}
      onAddMember={(userId, role) => {
        setCandidate(null);
        runAndReload(() => moderation.addMember(userId, role));
      }}
      onRemoveRole={(memberId) => runAndReload(() => moderation.removeRole(memberId))}
    />
  );
}
