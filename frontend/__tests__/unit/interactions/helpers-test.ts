import {
  assertTarget,
  normalizePagination,
  validateContent,
  parseError,
  attachStatsToComments,
  buildCommentTree,
  targetToFilter,
} from "@/services/supabase/interactions/helper";
import { MAX_COMMENT_LENGTH, MAX_PAGE_LIMIT, DEFAULT_LIMIT } from "@/services/supabase/interactions/types";
import type { AppComment } from "@/services/supabase/interactions/types";

// ─── MOCK SUPABASE ────────────────────────────────────────────────────────────
const mockSupabase: Record<string, jest.Mock> = {
  rpc: jest.fn(),
};

Object.values(mockSupabase).forEach((fn) => fn.mockReturnValue(mockSupabase));

jest.mock("@/lib/supabase/client", () => ({
  __esModule: true,
  get supabase() {
    return mockSupabase;
  },
}));

// ─── MOCK VALIDATION ──────────────────────────────────────────────────────────
jest.mock("@/services/supabase/helpers/validation", () => ({
  __esModule: true,
  assertUUID: jest.fn(), // no lanza por defecto → UUID válido
}));

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function resetChain() {
  Object.values(mockSupabase).forEach((fn) => {
    fn.mockReset();
    fn.mockReturnValue(mockSupabase);
  });
}

/** Crea un AppComment mínimo válido */
function makeComment(overrides: Partial<AppComment> = {}): AppComment {
  return {
    comment_id:       overrides.comment_id       ?? "c1",
    user_id:          overrides.user_id          ?? "u1",
    post_id:          overrides.post_id          ?? "p1",
    fragment_id:      overrides.fragment_id      ?? null,
    parent_comment_id: overrides.parent_comment_id ?? null,
    content:          overrides.content          ?? "Hola",
    created_at:       overrides.created_at       ?? "2024-01-01T00:00:00Z",
    updated_at:       overrides.updated_at       ?? "2024-01-01T00:00:00Z",
    author: overrides.author ?? {
      user_id:     "u1",
      username:    "user1",
      full_name:   "User One",
      profile_pic: null,
    },
    replies:       overrides.replies       ?? [],
    replies_count: overrides.replies_count ?? 0,
    liked_by_me:   overrides.liked_by_me   ?? false,
    likes_count:   overrides.likes_count   ?? 0,
  };
}

const validUUID = "550e8400-e29b-41d4-a716-446655440000";

// ─── assertTarget ─────────────────────────────────────────────────────────────
describe("assertTarget", () => {
  it("no lanza si se pasa postId válido", () => {
    expect(() => assertTarget({ postId: validUUID })).not.toThrow();
  });

  it("no lanza si se pasa fragmentId válido", () => {
    expect(() => assertTarget({ fragmentId: validUUID })).not.toThrow();
  });

  it("lanza si no se pasa ni postId ni fragmentId", () => {
    expect(() => assertTarget({} as any)).toThrow("Se requiere postId o fragmentId.");
  });

  it("llama assertUUID con 'postId' cuando se pasa postId", () => {
    const { assertUUID } = require("@/services/supabase/helpers/validation");
    assertTarget({ postId: validUUID });
    expect(assertUUID).toHaveBeenCalledWith(validUUID, "postId");
  });

  it("llama assertUUID con 'fragmentId' cuando se pasa fragmentId", () => {
    const { assertUUID } = require("@/services/supabase/helpers/validation");
    assertTarget({ fragmentId: validUUID });
    expect(assertUUID).toHaveBeenCalledWith(validUUID, "fragmentId");
  });
});

// ─── normalizePagination ──────────────────────────────────────────────────────
describe("normalizePagination", () => {
  it("usa defaults cuando no se pasan parámetros", () => {
    const { from, to } = normalizePagination();
    expect(from).toBe(0);
    expect(to).toBe(DEFAULT_LIMIT - 1);
  });

  it("calcula correctamente page=1 con limit default", () => {
    const { from, to } = normalizePagination(1);
    expect(from).toBe(DEFAULT_LIMIT);
    expect(to).toBe(DEFAULT_LIMIT * 2 - 1);
  });

  it("fuerza page mínimo a 0 si se pasa negativo", () => {
    const { from } = normalizePagination(-5);
    expect(from).toBe(0);
  });

  it("fuerza limit mínimo a 1 si se pasa 0 o negativo", () => {
    const { from, to } = normalizePagination(0, 0);
    expect(to - from).toBe(0); // limit=1 → to = from + 0
  });

  it(`fuerza limit máximo a ${MAX_PAGE_LIMIT} si se pasa un valor gigante`, () => {
    const { from, to } = normalizePagination(0, 9999);
    expect(to).toBe(MAX_PAGE_LIMIT - 1);
  });

  it("trunca page decimal con Math.floor", () => {
    const { from } = normalizePagination(1.9, 10);
    expect(from).toBe(10); // floor(1.9) = 1 → 1 * 10
  });
});

// ─── validateContent ──────────────────────────────────────────────────────────
describe("validateContent", () => {
  it("retorna el contenido trimmeado si es válido", () => {
    expect(validateContent("  Hola  ")).toBe("Hola");
  });

  it("lanza si el contenido está vacío", () => {
    expect(() => validateContent("")).toThrow("El contenido no puede estar vacío.");
  });

  it("lanza si el contenido es solo espacios", () => {
    expect(() => validateContent("   ")).toThrow("El contenido no puede estar vacío.");
  });

  it(`lanza si el contenido supera ${MAX_COMMENT_LENGTH} caracteres`, () => {
    const largo = "a".repeat(MAX_COMMENT_LENGTH + 1);
    expect(() => validateContent(largo)).toThrow(
      `El contenido no puede superar ${MAX_COMMENT_LENGTH} caracteres.`
    );
  });

  it("usa el label personalizado en el mensaje de error", () => {
    expect(() => validateContent("", "comentario")).toThrow(
      "El comentario no puede estar vacío."
    );
  });

  it("acepta contenido exactamente en el límite máximo", () => {
    const exacto = "a".repeat(MAX_COMMENT_LENGTH);
    expect(() => validateContent(exacto)).not.toThrow();
  });
});

// ─── parseError ───────────────────────────────────────────────────────────────
describe("parseError", () => {
  it("retorna 'Error desconocido' si err es falsy", () => {
    expect(parseError(null)).toBe("Error desconocido");
    expect(parseError(undefined)).toBe("Error desconocido");
  });

  it("mapea 'row-level security' a mensaje de permisos", () => {
    expect(parseError(new Error("row-level security policy violated")))
      .toBe("No tienes permiso para realizar esta acción.");
  });

  it("mapea 'duplicate key value violates unique constraint' a like duplicado", () => {
    expect(parseError(new Error("duplicate key value violates unique constraint")))
      .toBe("Ya diste like a esta publicación.");
  });

  it("mapea 'violates check constraint' a error de validación", () => {
    expect(parseError(new Error("violates check constraint")))
      .toBe("Error de validación.");
  });

  it("mapea 'NetworkError' a error de red", () => {
    expect(parseError(new Error("NetworkError occurred")))
      .toBe("Error de red. Verifica tu conexión.");
  });

  it("mapea 'Failed to fetch' a error de red", () => {
    expect(parseError(new Error("Failed to fetch")))
      .toBe("Error de red. Verifica tu conexión.");
  });

  it("retorna el mensaje original si empieza con 'No hay sesión'", () => {
    expect(parseError(new Error("No hay sesión activa.")))
      .toBe("No hay sesión activa.");
  });

  it("retorna el mensaje original si empieza con 'El comentario'", () => {
    expect(parseError(new Error("El comentario padre no existe.")))
      .toBe("El comentario padre no existe.");
  });

  it("retorna el mensaje original si contiene 'inválido'", () => {
    expect(parseError(new Error("UUID inválido proporcionado")))
      .toBe("UUID inválido proporcionado");
  });

  it("retorna el mensaje original si contiene 'no puede'", () => {
    expect(parseError(new Error("El contenido no puede estar vacío.")))
      .toBe("El contenido no puede estar vacío.");
  });

  it("retorna el mensaje original si contiene 'no existe'", () => {
    expect(parseError(new Error("El recurso no existe")))
      .toBe("El recurso no existe");
  });

  it("retorna el mensaje original si contiene 'no pertenece'", () => {
    expect(parseError(new Error("El comentario no pertenece a esta publicación")))
      .toBe("El comentario no pertenece a esta publicación");
  });

  it("retorna 'Ocurrió un error inesperado.' para errores desconocidos", () => {
    expect(parseError(new Error("algún error raro interno")))
      .toBe("Ocurrió un error inesperado.");
  });

  it("maneja errores sin .message usando String(err)", () => {
    expect(parseError("row-level security")).toBe("No tienes permiso para realizar esta acción.");
  });
});

// ─── targetToFilter ───────────────────────────────────────────────────────────
describe("targetToFilter", () => {
  it("retorna post_id cuando el target tiene postId", () => {
    const result = targetToFilter({ postId: "p1" });
    expect(result).toEqual({ field: "post_id", value: "p1" });
  });

  it("retorna fragment_id cuando el target tiene fragmentId", () => {
    const result = targetToFilter({ fragmentId: "f1" });
    expect(result).toEqual({ field: "fragment_id", value: "f1" });
  });
});

// ─── buildCommentTree ─────────────────────────────────────────────────────────
describe("buildCommentTree", () => {
  it("retorna array vacío si no hay comentarios", () => {
    expect(buildCommentTree([])).toEqual([]);
  });

  it("retorna solo comentarios raíz (parent_comment_id = null)", () => {
    const comments = [
      makeComment({ comment_id: "c1", parent_comment_id: null }),
      makeComment({ comment_id: "c2", parent_comment_id: "c1" }),
    ];
    const tree = buildCommentTree(comments);
    expect(tree).toHaveLength(1);
    expect(tree[0].comment_id).toBe("c1");
  });

  it("anida replies correctamente", () => {
    const comments = [
      makeComment({ comment_id: "c1", parent_comment_id: null }),
      makeComment({ comment_id: "c2", parent_comment_id: "c1" }),
      makeComment({ comment_id: "c3", parent_comment_id: "c1" }),
    ];
    const tree = buildCommentTree(comments);
    expect(tree[0].replies).toHaveLength(2);
    expect(tree[0].replies![0].comment_id).toBe("c2");
    expect(tree[0].replies![1].comment_id).toBe("c3");
  });

  it("anida replies de segundo nivel (árbol profundo)", () => {
    const comments = [
      makeComment({ comment_id: "c1", parent_comment_id: null }),
      makeComment({ comment_id: "c2", parent_comment_id: "c1" }),
      makeComment({ comment_id: "c3", parent_comment_id: "c2" }),
    ];
    const tree = buildCommentTree(comments);
    expect(tree[0].replies![0].replies).toHaveLength(1);
    expect(tree[0].replies![0].replies![0].comment_id).toBe("c3");
  });

  it("múltiples comentarios raíz", () => {
    const comments = [
      makeComment({ comment_id: "c1", parent_comment_id: null }),
      makeComment({ comment_id: "c2", parent_comment_id: null }),
    ];
    const tree = buildCommentTree(comments);
    expect(tree).toHaveLength(2);
  });

  it("filtra por parentId específico", () => {
    const comments = [
      makeComment({ comment_id: "c1", parent_comment_id: null }),
      makeComment({ comment_id: "c2", parent_comment_id: "c1" }),
      makeComment({ comment_id: "c3", parent_comment_id: "c1" }),
    ];
    const subtree = buildCommentTree(comments, "c1");
    expect(subtree).toHaveLength(2);
  });
});

// ─── attachStatsToComments ────────────────────────────────────────────────────
describe("attachStatsToComments", () => {
  beforeEach(() => resetChain());

  it("retorna array vacío si no hay comentarios", async () => {
    const result = await attachStatsToComments([], "u1");
    expect(result).toEqual([]);
    expect(mockSupabase.rpc).not.toHaveBeenCalled();
  });

  it("mergea stats correctamente a los comentarios", async () => {
    const comments = [makeComment({ comment_id: "c1" })];
    mockSupabase.rpc.mockResolvedValueOnce({
      data: [{ comment_id: "c1", likes_count: 3, replies_count: 1, liked_by_me: true }],
      error: null,
    });

    const result = await attachStatsToComments(comments, "u1");

    expect(result[0].likes_count).toBe(3);
    expect(result[0].replies_count).toBe(1);
    expect(result[0].liked_by_me).toBe(true);
  });

  it("usa valores por defecto (0/false) si el comentario no tiene stats", async () => {
    const comments = [makeComment({ comment_id: "c1" })];
    mockSupabase.rpc.mockResolvedValueOnce({
      data: [], // sin stats para c1
      error: null,
    });

    const result = await attachStatsToComments(comments, "u1");

    expect(result[0].likes_count).toBe(0);
    expect(result[0].replies_count).toBe(0);
    expect(result[0].liked_by_me).toBe(false);
  });

  it("usa valores por defecto si data es null", async () => {
    const comments = [makeComment({ comment_id: "c1" })];
    mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });

    const result = await attachStatsToComments(comments, "u1");

    expect(result[0].likes_count).toBe(0);
  });

  it("lanza si el RPC retorna error", async () => {
    const comments = [makeComment({ comment_id: "c1" })];
    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error: new Error("RPC error"),
    });

    await expect(attachStatsToComments(comments, "u1")).rejects.toThrow("RPC error");
  });

  it("pasa los comment_ids y currentUserId correctamente al RPC", async () => {
    const comments = [
      makeComment({ comment_id: "c1" }),
      makeComment({ comment_id: "c2" }),
    ];
    mockSupabase.rpc.mockResolvedValueOnce({ data: [], error: null });

    await attachStatsToComments(comments, "user-123");

    expect(mockSupabase.rpc).toHaveBeenCalledWith("get_comment_stats", {
      comment_ids:     ["c1", "c2"],
      current_user_id: "user-123",
    });
  });
});