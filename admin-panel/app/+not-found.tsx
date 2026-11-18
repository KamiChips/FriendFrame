import { router } from "expo-router";

import { ScreenState } from "@/components/layout/ScreenState";
import { useShell } from "@/hooks/use-shell";
import { ErrorScreen } from "@/screens/ErrorScreen";

export default function NotFoundRoute() {
  const shell = useShell();
  if (!shell) return <ScreenState />;

  return <ErrorScreen shell={shell} kind="not-found" onAction={() => router.replace("/dashboard")} />;
}
