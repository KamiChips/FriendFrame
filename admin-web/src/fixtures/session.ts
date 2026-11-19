import type { CurrentUser } from "@/types/moderation";

// cuentas del equipo con que se entra al modo simulado; las usan las pruebas y el servicio simulado
export const adminUser: CurrentUser = { handle: "@admin", initials: "A", role: "admin" };
export const moderatorUser: CurrentUser = { handle: "@moderador1", initials: "M", role: "moderator" };

// dominio de correo del equipo en el modo simulado
export const teamEmailDomain = "friendframe.test";
