import { router } from "expo-router";
import { useState } from "react";

import { ScreenState } from "@/components/layout/ScreenState";
import { accountStatusOptions } from "@/constants/filters";
import { useAsync } from "@/hooks/use-async";
import { useCycle } from "@/hooks/use-cycle";
import { useShell } from "@/hooks/use-shell";
import { UsersScreen } from "@/screens/UsersScreen";
import { moderation } from "@/services/moderation";

export default function UsersRoute() {
  const shell = useShell();
  const status = useCycle(accountStatusOptions);
  const [query, setQuery] = useState("");
  const { data, error, reload } = useAsync(
    () => moderation.getUsers({ query, status: status.option.value }),
    [query, status.option],
  );

  if (!shell || !data) return <ScreenState error={error} onRetry={reload} />;

  return (
    <UsersScreen
      shell={shell}
      totalAccounts={data.totalAccounts}
      statusFilter={status.option.label}
      users={data.users}
      hasMore={data.hasMore}
      onSearch={setQuery}
      onOpenStatusFilter={status.next}
      onViewProfile={(userId) => router.push(`/users/${userId}`)}
    />
  );
}
