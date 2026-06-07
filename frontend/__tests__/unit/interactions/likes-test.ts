import {
  toggleLike,
  likePost,
  unlikePost,
  likeFragment,
  unlikeFragment,
  toggleLikePost,
  toggleLikeFragment,
  getLikers,
} from "@/services/supabase/interactions/likes";
import { getAuthUser } from "@/services/supabase/helpers/validation";
import { assertTarget } from "@/services/supabase/interactions/helper";

// ─── CHAINABLE SUPABASE MOCK ──────────────────────────────────────────────────
// Cada método devuelve `mockSupabase` para soportar encadenamiento arbitrario.
// `single` y `limit` son los terminadores de cadena; se sobreescriben por test.
const mockSupabase: Record<string, jest.Mock> = {
  rpc:    jest.fn(),
  from:   jest.fn(),
  insert: jest.fn(),
  delete: jest.fn(),
  select: jest.fn(),
  eq:     jest.fn(),
  order:  jest.fn(),
  limit:  jest.fn(),
  single: jest.fn(),
};

// Todos los métodos retornan el mismo objeto para que la cadena nunca se rompa
Object.keys(mockSupabase).forEach((key) => {
  mockSupabase[key].mockReturnValue(mockSupabase);
});

// IMPORTANTE: jest.mock se eleva al tope del archivo por Babel/Jest,
// pero la factory se ejecuta antes de cualquier import. Usamos
// jest.mock con una factory que referencia el objeto ya definido
// a través del módulo — por eso usamos `mockSupabaseRef`.
let mockSupabaseRef = mockSupabase;

jest.mock("@/lib/supabase/client", () => ({
  __esModule: true,
  // La factory captura `mockSupabaseRef` en el closure
  get supabase() {
    return mockSupabaseRef;
  },
}));

jest.mock("@/services/supabase/helpers/validation", () => ({
  __esModule: true,
  assertUUID: jest.fn(),
  getAuthUser: jest.fn(),
}));

jest.mock("@/services/supabase/interactions/helper", () => ({
  __esModule: true,
  assertTarget: jest.fn(),
  parseError: jest.fn((err: any) => err?.message ?? "Error"),
  targetToFilter: jest.fn((target: any) =>
    target.postId
      ? { field: "post_id",     value: target.postId }
      : { field: "fragment_id", value: target.fragmentId }
  ),
}));

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const userId = "550e8400-e29b-41d4-a716-446655440000";

/** Resetea todos los mocks Y restaura el comportamiento de cadena */
function resetChain() {
  Object.values(mockSupabase).forEach((fn) => {
    fn.mockReset();
    fn.mockReturnValue(mockSupabase);
  });
}

describe("Likes Service — Unit", () => {
  beforeEach(() => {
    resetChain();
    (getAuthUser as jest.Mock).mockResolvedValue(userId);
  });

  // ─── toggleLike / toggleLikePost / toggleLikeFragment ─────────────────────
  describe("toggleLike y Alias", () => {
    it("toggleLike retorna éxito (cubre postId ?? null)", async () => {
      // rpc(...).single() → resuelve con data
      mockSupabase.single.mockResolvedValueOnce({
        data: { liked: true, likes_count: 5 },
        error: null,
      });
      const result = await toggleLike({ postId: "post-1" });
      expect(result.error).toBeNull();
      expect(result.data).toEqual({ liked: true, count: 5 });
    });

    it("toggleLike retorna éxito (cubre fragmentId ?? null)", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { liked: true, likes_count: 1 },
        error: null,
      });
      const result = await toggleLike({ fragmentId: "frag-1" });
      expect(result.error).toBeNull();
    });

    it("toggleLike retorna error si falla RPC", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error("RPC error"),
      });
      const result = await toggleLike({ postId: "post-1" });
      expect(result.error).toBe("RPC error");
    });

    it("toggleLike va al catch block si hay error síncrono", async () => {
      (getAuthUser as jest.Mock).mockRejectedValueOnce(
        new Error("Catch block error")
      );
      const result = await toggleLike({ postId: "post-1" });
      expect(result.error).toBe("Catch block error");
    });

    it("toggleLikePost funciona correctamente", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { liked: true, likes_count: 1 },
        error: null,
      });
      const result = await toggleLikePost("post-1");
      expect(result.data?.count).toBe(1);
    });

    it("toggleLikeFragment funciona correctamente", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { liked: false, likes_count: 0 },
        error: null,
      });
      const result = await toggleLikeFragment("frag-1");
      expect(result.data?.liked).toBe(false);
    });
  });

  // ─── likePost / unlikePost ─────────────────────────────────────────────────
  describe("likePost / unlikePost", () => {
    it("likePost inserta con éxito", async () => {
      // from().insert().select().single()
      mockSupabase.single.mockResolvedValueOnce({
        data: { post_id: "post-1" },
        error: null,
      });
      const result = await likePost("post-1");
      expect(result.error).toBeNull();
    });

    it("likePost retorna error en falla de inserción", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error("DB insert error"),
      });
      const result = await likePost("post-1");
      expect(result.error).toBe("DB insert error");
    });

    it("likePost va al catch block", async () => {
      (getAuthUser as jest.Mock).mockRejectedValueOnce(new Error("Catch error"));
      const result = await likePost("post-1");
      expect(result.error).toBe("Catch error");
    });

    it("unlikePost elimina con éxito", async () => {
      // from().delete().eq().eq() — el último eq() es el terminador
      // Necesitamos que el SEGUNDO eq resuelva, no el primero.
      // Como ambos retornan mockSupabase, sobreescribimos `eq` para que
      // la segunda llamada resuelva con el valor esperado.
      mockSupabase.eq
        .mockReturnValueOnce(mockSupabase)           // primera llamada: .eq('user_id', ...)
        .mockResolvedValueOnce({ error: null });     // segunda llamada: .eq('post_id', ...) — termina la cadena
      const result = await unlikePost("post-1");
      expect(result.error).toBeNull();
    });

    it("unlikePost retorna error en falla", async () => {
      mockSupabase.eq
        .mockReturnValueOnce(mockSupabase)
        .mockResolvedValueOnce({ error: new Error("DB delete error") });
      const result = await unlikePost("post-1");
      expect(result.error).toBe("DB delete error");
    });

    it("unlikePost va al catch block", async () => {
      (getAuthUser as jest.Mock).mockRejectedValueOnce(new Error("Catch error"));
      const result = await unlikePost("post-1");
      expect(result.error).toBe("Catch error");
    });
  });

  // ─── likeFragment / unlikeFragment ────────────────────────────────────────
  describe("likeFragment / unlikeFragment", () => {
    it("likeFragment inserta con éxito", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { fragment_id: "frag-1" },
        error: null,
      });
      const result = await likeFragment("frag-1");
      expect(result.error).toBeNull();
    });

    it("likeFragment retorna error en falla", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error("DB insert error"),
      });
      const result = await likeFragment("frag-1");
      expect(result.error).toBe("DB insert error");
    });

    it("likeFragment va al catch block", async () => {
      (getAuthUser as jest.Mock).mockRejectedValueOnce(new Error("Catch error"));
      const result = await likeFragment("frag-1");
      expect(result.error).toBe("Catch error");
    });

    it("unlikeFragment elimina con éxito", async () => {
      mockSupabase.eq
        .mockReturnValueOnce(mockSupabase)
        .mockResolvedValueOnce({ error: null });
      const result = await unlikeFragment("frag-1");
      expect(result.error).toBeNull();
    });

    it("unlikeFragment retorna error en falla", async () => {
      mockSupabase.eq
        .mockReturnValueOnce(mockSupabase)
        .mockResolvedValueOnce({ error: new Error("DB delete error") });
      const result = await unlikeFragment("frag-1");
      expect(result.error).toBe("DB delete error");
    });

    it("unlikeFragment va al catch block", async () => {
      (getAuthUser as jest.Mock).mockRejectedValueOnce(new Error("Catch error"));
      const result = await unlikeFragment("frag-1");
      expect(result.error).toBe("Catch error");
    });
  });

  // ─── getLikers ─────────────────────────────────────────────────────────────
  describe("getLikers", () => {
    it("retorna lista mapeada de usuarios (sin pasar límite usa default)", async () => {
      // from().select().eq().order().limit()
      mockSupabase.limit.mockResolvedValueOnce({
        data: [{ user: { user_id: "u1" } }],
        error: null,
      });
      const result = await getLikers({ postId: "post-1" });
      expect(result.error).toBeNull();
      expect(result.data).toEqual([{ user_id: "u1" }]);
    });

    it("fuerza Math.max(1) pasando límite negativo o 0", async () => {
      mockSupabase.limit.mockResolvedValueOnce({
        data: [{ user: { user_id: "u1" } }],
        error: null,
      });
      const result = await getLikers({ postId: "post-1" }, 0);
      expect(result.error).toBeNull();
    });

    it("fuerza Math.min(100) pasando límite gigante", async () => {
      mockSupabase.limit.mockResolvedValueOnce({
        data: [{ user: { user_id: "u1" } }],
        error: null,
      });
      const result = await getLikers({ postId: "post-1" }, 500);
      expect(result.error).toBeNull();
    });

    it("retorna arreglo vacío si data es null (cubre data ?? [])", async () => {
      mockSupabase.limit.mockResolvedValueOnce({ data: null, error: null });
      const result = await getLikers({ postId: "post-1" });
      expect(result.data).toEqual([]);
    });

    it("retorna error de base de datos", async () => {
      mockSupabase.limit.mockResolvedValueOnce({
        data: null,
        error: new Error("DB error"),
      });
      const result = await getLikers({ postId: "post-1" });
      expect(result.error).toBe("DB error");
    });

    it("va al catch block", async () => {
      (assertTarget as jest.Mock).mockImplementationOnce(() => {
        throw new Error("Sync catch error");
      });
      const result = await getLikers({ postId: "post-1" });
      expect(result.error).toBe("Sync catch error");
    });
  });
});