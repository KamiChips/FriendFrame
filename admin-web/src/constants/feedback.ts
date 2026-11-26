import type { AuthErrorReason } from "@/services/moderation/types";

// mensaje del login para cada motivo de rechazo
export const authErrorMessages: Record<AuthErrorReason, string> = {
  invalid_credentials: "Incorrect email or password",
  not_authorized: "You don't have access to the panel",
};

export type ErrorKind = "forbidden" | "not-found" | "unexpected";

// textos de las paginas de error
export const errorPages: Record<
  ErrorKind,
  { title: string; code: string; heading: string; description: string; actionLabel: string }
> = {
  forbidden: {
    title: "Error 403",
    code: "403",
    heading: "You don't have permission to view this section",
    description: "This section is only available to admins.",
    actionLabel: "Back to dashboard",
  },
  "not-found": {
    title: "Error 404",
    code: "404",
    heading: "We couldn't find this page",
    description: "The link doesn't exist or the page has moved.",
    actionLabel: "Back to dashboard",
  },
  unexpected: {
    title: "Unexpected error",
    code: "Oops...",
    heading: "Something went wrong",
    description: "An unexpected error occurred. Your saved changes are safe.",
    actionLabel: "Reload",
  },
};

// aviso cuando una accion no se pudo guardar
export const actionFailedToast = {
  variant: "error" as const,
  title: "The action couldn't be applied",
  message: "No changes were saved. Please try again.",
};
