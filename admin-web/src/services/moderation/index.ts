import { createMockModerationService } from "./mock";
import type { ModerationService } from "./types";

export type * from "./types";
export { AuthError } from "./types";

const mock = createMockModerationService({ latencyMs: import.meta.env.MODE === "test" ? 0 : 250 });

// punto unico de datos de la app: para usar el backend real, cambiar esta asignacion
// por una implementacion de ModerationService que llame a la API (ver README)
export const moderation: ModerationService = mock;

// devuelve los datos simulados a su estado inicial; lo usan las pruebas
export const resetMockData = () => mock.reset();
