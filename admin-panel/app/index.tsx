import { router } from "expo-router";
import { useState } from "react";

import { authErrorMessages } from "@/constants/feedback";
import { LoginScreen } from "@/screens/LoginScreen";
import { moderation } from "@/services/moderation";
import { AuthError } from "@/services/moderation/types";

export default function LoginRoute() {
  const [errorMessage, setErrorMessage] = useState<string>();

  return (
    <LoginScreen
      errorMessage={errorMessage}
      onSubmit={async (credentials) => {
        try {
          await moderation.signIn(credentials);
          router.replace("/dashboard");
        } catch (error) {
          setErrorMessage(
            error instanceof AuthError
              ? authErrorMessages[error.reason]
              : "No se pudo iniciar sesión. Intenta de nuevo.",
          );
        }
      }}
    />
  );
}
