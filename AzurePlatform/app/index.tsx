import { router } from "expo-router";

import { LoginScreen } from "@/screens/LoginScreen";
import { moderation } from "@/services/moderation";

export default function LoginRoute() {
  return (
    <LoginScreen
      onSubmit={async (credentials) => {
        await moderation.signIn(credentials);
        router.replace("/dashboard");
      }}
    />
  );
}
