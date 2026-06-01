import { supabase } from "@/lib/supabase/client";
import { AuthUser } from "@/services/supabase/auth/auth.types";
import { fetchProfile } from "./auth.helpers";

export function onAuthStateChange(
  callback: (user: AuthUser | null) => void,
): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (!session?.user) {
      callback(null);
      return;
    }

    if (
      event === "SIGNED_IN" ||
      event === "TOKEN_REFRESHED" ||
      event === "INITIAL_SESSION"
    ) {
      try {
        const profile = await fetchProfile(session.user.id);
        callback(profile);
      } catch {
        callback(null);
      }
    }

    if (event === "SIGNED_OUT") {
      callback(null);
    }
  });

  return () => subscription.unsubscribe();
}
