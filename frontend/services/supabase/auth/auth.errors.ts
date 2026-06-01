import { MIN_PASSWORD_LEN } from "./auth.types";

export function parseAuthError(error: unknown): string {
  if (!error) return "Error desconocido";
  const msg = (error as Error).message ?? String(error);

  const known: [string, string][] = [
    ["User already registered", "Ya existe una cuenta con ese email."],
    ["Invalid login credentials", "Email o contraseña incorrectos."],
    ["Email not confirmed", "Confirma tu email antes de iniciar sesión."],
    [
      "Password should be at least",
      `La contraseña debe tener al menos ${MIN_PASSWORD_LEN} caracteres.`,
    ],
    [
      "Unable to validate email address",
      "El email no tiene un formato válido.",
    ],
    ["duplicate key.*username", "Ese nombre de usuario ya está en uso."],
    ["Auth session missing", "No hay sesión activa."],
    ["NetworkError", "Error de red. Verifica tu conexión."],
    ["Failed to fetch", "Error de red. Verifica tu conexión."],
    ["over_email_send_rate_limit", "Demasiados intentos. Espera unos minutos."],
    ["Token has expired", "El enlace ha expirado. Solicita uno nuevo."],
  ];

  for (const [pattern, message] of known) {
    if (new RegExp(pattern).test(msg)) return message;
  }

  if (
    msg.startsWith("El email") ||
    msg.startsWith("La contraseña") ||
    msg.startsWith("El nombre") ||
    msg.startsWith("El username") ||
    msg.startsWith("La URL") ||
    msg.startsWith("No hay sesión") ||
    msg.startsWith("El ID")
  )
    return msg;

  return "Ocurrió un error inesperado.";
}
