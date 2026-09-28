import { useAuth } from "@/context/AuthContext";
import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

export function RouteGuard() {
  const { user, loading, pendingVerificationEmail } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const isAuthGroup = segments[0] === "(auth)";

    if(!user && pendingVerificationEmail) {
      router.replace(`/(auth)/verify-email?email=${encodeURIComponent(pendingVerificationEmail)}`);
    } else if (!user && !isAuthGroup) {
      router.replace("/(auth)/login");
    }  else if (user && isAuthGroup) {
      router.replace("/(tabs)/Feed");
    } 
  }, [user, loading, segments, pendingVerificationEmail]);
  return null;
}
