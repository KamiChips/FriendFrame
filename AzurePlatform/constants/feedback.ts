import type { AuthErrorReason } from "@/services/moderation/types";

// mensaje del login para cada motivo de rechazo
export const authErrorMessages: Record<AuthErrorReason, string> = {
  invalid_credentials: "Correo o contraseña incorrectos",
  not_authorized: "No tienes acceso al panel",
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
    heading: "No tienes permiso para ver esta sección",
    description: "Esta sección está disponible solo para administradores.",
    actionLabel: "Volver al dashboard",
  },
  "not-found": {
    title: "Error 404",
    code: "404",
    heading: "No encontramos esta página",
    description: "El enlace no existe o la página cambió de lugar.",
    actionLabel: "Volver al dashboard",
  },
  unexpected: {
    title: "Error inesperado",
    code: "Ups...",
    heading: "Algo salió mal",
    description: "Ocurrió un error inesperado. Tus cambios guardados están seguros.",
    actionLabel: "Recargar",
  },
};

// aviso cuando una accion no se pudo guardar
export const actionFailedToast = {
  variant: "error" as const,
  title: "No se pudo aplicar la acción",
  message: "No se guardaron cambios. Intenta de nuevo.",
};
