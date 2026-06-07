import {
  addComment,
  editComment,
  deleteComment,
  getComments,
  getReplies,
} from "@/services/supabase/interactions/comments";
import { getAuthUser } from "@/services/supabase/helpers/validation";
import { attachStatsToComments, buildCommentTree, assertTarget } from "@/services/supabase/interactions/helper";

// ─── CHAINABLE SUPABASE MOCK ──────────────────────────────────────────────────
// Se define como Record para poder iterar las keys y restaurar la cadena en cada test.
const mockSupabase: Record<string, jest.Mock> = {
  from:        jest.fn(),
  select:      jest.fn(),
  insert:      jest.fn(),
  update:      jest.fn(),
  delete:      jest.fn(),
  eq:          jest.fn(),
  order:       jest.fn(),
  range:       jest.fn(),
  is:          jest.fn(),
  single:      jest.fn(),
  maybeSingle: jest.fn(),
};

// Usar getter para evitar el problema de hoisting con jest.mock:
// la factory se eleva al tope del archivo y las variables `const`
// no estarían disponibles en ese momento sin el getter.
jest.mock("@/lib/supabase/client", () => ({
  __esModule: true,
  get supabase() {
    return mockSupabase;
  },
}));

// ─── HELPERS MOCKS ────────────────────────────────────────────────────────────
jest.mock("@/services/supabase/helpers/validation", () => ({
  __esModule: true,
  assertUUID: jest.fn(),
  getAuthUser: jest.fn(),
}));

jest.mock("@/services/supabase/interactions/helper", () => ({
  __esModule: true,
  assertTarget:          jest.fn(),
  validateContent:       jest.fn((val: any) => val),
  targetToFilter:        jest.fn(() => ({ field: "post_id", value: "post-123" })),
  parseError:            jest.fn((err: any) => err?.message ?? "Error"),
  attachStatsToComments: jest.fn((comments: any) => comments),
  buildCommentTree:      jest.fn((comments: any) => comments),
  normalizePagination:   jest.fn(() => ({ from: 0, to: 9 })),
}));

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const userId        = "550e8400-e29b-41d4-a716-446655440000";
const postId        = "550e8400-e29b-41d4-a716-446655440001";
const commentId     = "550e8400-e29b-41d4-a716-446655440003";
const parentCommentId = "550e8400-e29b-41d4-a716-446655440004";

/** Resetea todos los mocks y restaura el comportamiento de cadena. */
function resetChain() {
  Object.values(mockSupabase).forEach((fn) => {
    fn.mockReset();
    fn.mockReturnValue(mockSupabase); // encadenamiento por defecto
  });
}

describe("Comments Service — Unit", () => {
  beforeEach(() => {
    resetChain();
    (getAuthUser as jest.Mock).mockResolvedValue(userId);
  });

  // ─── addComment ─────────────────────────────────────────────────────────────
  describe("addComment", () => {
    it("inserta exitosamente un comentario raíz", async () => {
      // Cadena: from().insert().select().single()
      mockSupabase.single.mockResolvedValueOnce({
        data: { comment_id: "c1" },
        error: null,
      });
      const result = await addComment({ postId }, "Hola");
      expect(result.error).toBeNull();
      expect(result.data?.comment_id).toBe("c1");
    });

    it("inserta exitosamente un comentario hijo (reply)", async () => {
      // Primero busca el padre: from().select().eq().eq().maybeSingle()
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: { comment_id: parentCommentId },
        error: null,
      });
      // Luego inserta: from().insert().select().single()
      mockSupabase.single.mockResolvedValueOnce({
        data: { comment_id: "c2" },
        error: null,
      });
      const result = await addComment({ postId }, "Reply", parentCommentId);
      expect(result.error).toBeNull();
    });

    it("retorna error si falla consulta del padre", async () => {
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: new Error("DB error buscando padre"),
      });
      const result = await addComment({ postId }, "Reply", parentCommentId);
      expect(result.error).toBe("DB error buscando padre");
    });

    it("retorna error si el comentario padre no existe", async () => {
      mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
      const result = await addComment({ postId }, "Reply", parentCommentId);
      expect(result.error).toBe(
        "El comentario padre no existe o no pertenece a esta publicación."
      );
    });

    it("retorna error si falla el insert", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error("DB insert error"),
      });
      const result = await addComment({ postId }, "Hola");
      expect(result.error).toBe("DB insert error");
    });

    it("va al catch block si getAuthUser lanza", async () => {
      (getAuthUser as jest.Mock).mockRejectedValueOnce(new Error("Auth error"));
      const result = await addComment({ postId }, "Hola");
      expect(result.error).toBe("Auth error");
    });
  });

  // ─── editComment ────────────────────────────────────────────────────────────
  describe("editComment", () => {
    it("edita exitosamente", async () => {
      // Cadena: from().update().eq().eq().select().single()
      mockSupabase.single.mockResolvedValueOnce({
        data: { comment_id: commentId },
        error: null,
      });
      const result = await editComment(commentId, "Nuevo");
      expect(result.error).toBeNull();
    });

    it("retorna error en falla de base de datos", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error("DB update error"),
      });
      const result = await editComment(commentId, "Nuevo");
      expect(result.error).toBe("DB update error");
    });

    it("retorna error si no hay permisos (!data)", async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: null });
      const result = await editComment(commentId, "Nuevo");
      expect(result.error).toBe("Comentario no encontrado o sin permisos.");
    });

    it("va al catch block si getAuthUser lanza", async () => {
      (getAuthUser as jest.Mock).mockRejectedValueOnce(new Error("Auth error"));
      const result = await editComment(commentId, "Nuevo");
      expect(result.error).toBe("Auth error");
    });
  });

  // ─── deleteComment ──────────────────────────────────────────────────────────
  describe("deleteComment", () => {
    it("elimina exitosamente", async () => {
      // Cadena: from().delete().eq('comment_id').eq('user_id')
      // La segunda llamada a .eq() es la que resuelve la promesa.
      mockSupabase.eq
        .mockReturnValueOnce(mockSupabase)          // primera: .eq('comment_id', ...)
        .mockResolvedValueOnce({ error: null });    // segunda: .eq('user_id', ...) — termina
      const result = await deleteComment(commentId);
      expect(result.error).toBeNull();
    });

    it("retorna error al fallar eliminación", async () => {
      mockSupabase.eq
        .mockReturnValueOnce(mockSupabase)
        .mockResolvedValueOnce({ error: new Error("DB delete error") });
      const result = await deleteComment(commentId);
      expect(result.error).toBe("DB delete error");
    });

    it("va al catch block si getAuthUser lanza", async () => {
      (getAuthUser as jest.Mock).mockRejectedValueOnce(new Error("Auth error"));
      const result = await deleteComment(commentId);
      expect(result.error).toBe("Auth error");
    });
  });

  // ─── getComments ────────────────────────────────────────────────────────────
  describe("getComments", () => {
    it("include_replies=true — éxito", async () => {
      // Cadena con árbol: from().select().eq().order()
      mockSupabase.order.mockResolvedValueOnce({
        data: [{ comment_id: "c1" }],
        error: null,
      });
      const result = await getComments({ postId }, userId, { include_replies: true });
      expect(result.error).toBeNull();
      expect(attachStatsToComments).toHaveBeenCalled();
      expect(buildCommentTree).toHaveBeenCalled();
    });

    it("include_replies=true — error", async () => {
      mockSupabase.order.mockResolvedValueOnce({
        data: null,
        error: new Error("Tree Error"),
      });
      const result = await getComments({ postId }, userId, { include_replies: true });
      expect(result.error).toBe("Tree Error");
    });

    it("include_replies=false — éxito con data", async () => {
      // Cadena paginada: from().select().eq().is().order().range()
      mockSupabase.range.mockResolvedValueOnce({
        data: [{ comment_id: "c2" }],
        error: null,
      });
      const result = await getComments({ postId }, userId, { include_replies: false });
      expect(result.error).toBeNull();
    });

    it("include_replies=false — fallback array vacío si data es null", async () => {
      mockSupabase.range.mockResolvedValueOnce({ data: null, error: null });
      const result = await getComments({ postId }, userId); // usa defaults
      expect(result.data).toEqual([]);
    });

    it("include_replies=false — error DB", async () => {
      mockSupabase.range.mockResolvedValueOnce({
        data: null,
        error: new Error("DB error"),
      });
      const result = await getComments({ postId }, userId);
      expect(result.error).toBe("DB error");
    });

    it("va al catch block si assertTarget lanza", async () => {
      // getComments recibe userId como parámetro, no llama getAuthUser internamente.
      // El catch se alcanza forzando un error síncrono en assertTarget.
      (assertTarget as jest.Mock).mockImplementationOnce(() => {
        throw new Error("Sync catch error");
      });
      const result = await getComments({ postId }, userId);
      expect(result.error).toBe("Sync catch error");
    });
  });

  // ─── getReplies ─────────────────────────────────────────────────────────────
  describe("getReplies", () => {
    it("obtiene respuestas con éxito", async () => {
      // Cadena: from().select().eq().order().range()
      mockSupabase.range.mockResolvedValueOnce({
        data: [{ comment_id: "r1" }],
        error: null,
      });
      const result = await getReplies(parentCommentId, userId, { page: 1, limit: 10 });
      expect(result.error).toBeNull();
    });

    it("fallback a array vacío si no hay data", async () => {
      mockSupabase.range.mockResolvedValueOnce({ data: null, error: null });
      const result = await getReplies(parentCommentId, userId);
      expect(result.data).toEqual([]);
    });

    it("retorna error de base de datos", async () => {
      mockSupabase.range.mockResolvedValueOnce({
        data: null,
        error: new Error("Reply Error"),
      });
      const result = await getReplies(parentCommentId, userId);
      expect(result.error).toBe("Reply Error");
    });

    it("va al catch block si from lanza síncronamente", async () => {
      // getReplies tampoco llama getAuthUser; forzamos el catch
      // haciendo que el primer método de la cadena lance.
      mockSupabase.from.mockImplementationOnce(() => {
        throw new Error("Sync DB error");
      });
      const result = await getReplies(parentCommentId, userId);
      expect(result.error).toBe("Sync DB error");
    });
  });
});