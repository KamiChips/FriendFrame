import { ScreenState } from "@/components/layout/ScreenState";
import { useAsync } from "@/hooks/use-async";
import { useShell } from "@/hooks/use-shell";
import { TeamScreen } from "@/screens/TeamScreen";
import { moderation } from "@/services/moderation";

export default function TeamRoute() {
  const shell = useShell();
  const { data, error, reload } = useAsync(() => moderation.getTeam(), []);

  if (!shell || !data) return <ScreenState error={error} onRetry={reload} />;

  return (
    <TeamScreen
      shell={shell}
      members={data.members}
      lastUpdated={data.lastUpdated}
      onRemoveRole={async (memberId) => {
        await moderation.removeRole(memberId);
        reload();
      }}
    />
  );
}
