import { 
    getFeed 
} from "@/services/supabase/feed/feed.queries"

// Mocks

const mockRpc = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    rpc: (...args: any[]) => mockRpc(...args),
  },
}));

jest.mock("@/services/supabase/helpers/validation", () => ({
  getAuthUser: jest.fn(),
}));

jest.mock("@/services/supabase/feed/feed.helpers", () => ({
  mapRow: jest.fn((row) => ({ ...row, _mapped: true })),
  parseError: jest.fn((err: any) => err?.message ?? String(err)),
}));

import { getAuthUser } from "@/services/supabase/helpers/validation";
import { mapRow, parseError } from "@/services/supabase/feed/feed.helpers";

// Constantes

const USER_ID = "550e8400-e29b-41d4-a716-446655440000";

const makeRows = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `post-${i}` }));

beforeEach(() => {
  jest.clearAllMocks();
  (getAuthUser as jest.Mock).mockResolvedValue(USER_ID);
  (parseError as jest.Mock).mockImplementation((err: any) => err?.message ?? String(err));
  (mapRow as jest.Mock).mockImplementation((row) => ({ ...row, _mapped: true }));
});

// getFeed

describe("getFeed", () => {
  it("devuelve items mapeados correctamente", async () => {
    const rows = makeRows(5);
    mockRpc.mockResolvedValueOnce({ data: rows, error: null });

    const result = await getFeed(0, 5);

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(5);
    expect(result.data[0]).toMatchObject({ id: "post-0", _mapped: true });
    expect(mapRow).toHaveBeenCalledTimes(5);
  });

  it("llama al RPC con los parámetros correctos", async () => {
    mockRpc.mockResolvedValueOnce({ data: [], error: null });

    await getFeed(2, 10);

    expect(mockRpc).toHaveBeenCalledWith("get_home_feed", {
      p_user_id: USER_ID,
      p_limit: 11, // safeLimit + 1
      p_offset: 20, // página 2 * limit 10
    });
  });

  it("hasMore es true si el RPC devuelve más items que el límite", async () => {
    // pedimos limit=5, el RPC devuelve 6 (5+1)
    const rows = makeRows(6);
    mockRpc.mockResolvedValueOnce({ data: rows, error: null });

    const result = await getFeed(0, 5);

    expect(result.hasMore).toBe(true);
    expect(result.data).toHaveLength(5); // el extra se descarta
  });

  it("hasMore es false si el RPC devuelve exactamente el límite o menos", async () => {
    const rows = makeRows(5);
    mockRpc.mockResolvedValueOnce({ data: rows, error: null });

    const result = await getFeed(0, 5);

    expect(result.hasMore).toBe(false);
    expect(result.data).toHaveLength(5);
  });

  it("devuelve array vacío y hasMore false si no hay datos", async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: null });

    const result = await getFeed();

    expect(result.data).toEqual([]);
    expect(result.hasMore).toBe(false);
    expect(result.error).toBeNull();
  });

  it("devuelve error si el RPC falla", async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: new Error("RPC error") });

    const result = await getFeed();

    expect(result.data).toEqual([]);
    expect(result.hasMore).toBe(false);
    expect(result.error).toBe("RPC error");
  });

  it("clampea limit menor a 1 a 1", async () => {
    mockRpc.mockResolvedValueOnce({ data: [], error: null });

    await getFeed(0, -5);

    expect(mockRpc).toHaveBeenCalledWith("get_home_feed",
      expect.objectContaining({ p_limit: 2 }), // 1 + 1 extra
    );
  });

  it("clampea page negativa a 0", async () => {
    mockRpc.mockResolvedValueOnce({ data: [], error: null });

    await getFeed(-3, 10);

    expect(mockRpc).toHaveBeenCalledWith("get_home_feed",
      expect.objectContaining({ p_offset: 0 }),
    );
  });

  it("usa getAuthUser para obtener el usuario actual", async () => {
    mockRpc.mockResolvedValueOnce({ data: [], error: null });

    await getFeed();

    expect(getAuthUser).toHaveBeenCalledTimes(1);
  });
});