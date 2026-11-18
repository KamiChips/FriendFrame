import { mockModeration } from "./mock";
import type { ModerationService } from "./types";

export type * from "./types";

// punto unico de datos de la app: para usar datos reales, cambiar esta asignacion
export const moderation: ModerationService = mockModeration;
