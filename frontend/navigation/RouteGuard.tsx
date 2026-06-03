import { useAuth } from "@/context/AuthContext";
import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

export function RouteGuard() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const isAuthGroup = segments[0] == "(auth)";

    if (!user && !isAuthGroup) {
      router.replace("/(auth)/login");
    } else if (user && isAuthGroup) {
      router.replace("/home");
    }
  }, [user, loading, segments]);
  return null;
}
