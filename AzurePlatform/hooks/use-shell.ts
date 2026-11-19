import { router } from "expo-router";

import type { ShellProps } from "@/components/layout/AppShell";
import { sections } from "@/constants/navigation";
import { moderation } from "@/services/moderation";

import { useAsync } from "./use-async";

// datos y acciones de la navegacion comun; null mientras carga
export function useShell(): ShellProps | null {
  const { data } = useAsync(
    async () => ({
      currentUser: await moderation.getCurrentUser(),
      sectionCounts: await moderation.getSectionCounts(),
    }),
    [],
  );

  if (!data) return null;

  return {
    ...data,
    onNavigate: (key) => {
      const section = sections.find((candidate) => candidate.key === key);
      if (section) router.navigate(section.href);
    },
    onSignOut: async () => {
      await moderation.signOut();
      router.replace("/");
    },
  };
}
