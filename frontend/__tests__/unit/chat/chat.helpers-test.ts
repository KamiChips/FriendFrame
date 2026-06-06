import {
  assertUUIDs,
  normalizePagination,
  parseError,
  assertFriendship,
  assertMembership,
  findExistingDirectChat,
  getChatById,
} from "@/services/supabase/chat/chat.helpers"
import { parse } from "dotenv";

// Mocks

const mockMaybeSingle = jest.fn();
const mockSingle = jest.fn();
const mockNeq = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn();
const mockOrder = jest.fn();
const mockLimit = jest.fn();
const mockUpdate = jest.fn();
const mockFrom = jest.fn();
const mockRpc = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
    rpc: (...args: any[]) => mockRpc(...args),
  },
}));

jest.mock("@/services/supabase/helpers/validation", () => ({
  UUID_REGEX: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
}));

// Constantes 

const USER_A  = "550e8400-e29b-41d4-a716-446655440000";
const USER_B  = "6ba7b810-9dad-41d4-80b4-00c04fd430c8";
const CHAT_ID = "6ba7b814-9dad-41d4-80b4-00c04fd430c8";

beforeEach(() => jest.clearAllMocks());

// assertUUIDs
describe("assertUUIDs", () => {
  it("no lanza error con UUIDs válidos", () => {
    expect(() => assertUUIDs([USER_A, USER_B])).not.toThrow();
  });

  it("lanza error con un UUID inválido", () => {
    expect(() => assertUUIDs(["not-a-uuid"])).toThrow(/inválido/i);
  });

  it("incluye el índice en el mensaje de error", () => {
    expect(() => assertUUIDs([USER_A, "bad"])).toThrow(/\[1\]/);
  });

  it("usa el label personalizado en el error", () => {
    expect(() => assertUUIDs(["bad"], "MiLabel")).toThrow(/MiLabel/);
  });
});

// normalizePagination
describe("normalizePagination", () => {
  it("devuelve from/to correctors para página 0", () => {
    const { from, to } = normalizePagination(0, 20);
    expect(from).toBe(0);
    expect(to).toBe(19);
  });

  it("devuelve from/to correctos para página 2", () => {
    const { from, to } = normalizePagination(2, 10); // era (0, 20)
    expect(from).toBe(20);
    expect(to).toBe(29);
  });

  it("usa defaults si no se pasan argumentos", () => {
    const { from, to } = normalizePagination(0, 20);
    expect(from).toBeGreaterThanOrEqual(0);
    expect(to).toBeGreaterThan(from);
  });

  it("clampea limit negativo a 1", () => {
    const { from, to } = normalizePagination(0, -5); // era (0, 20)
    expect(to - from).toBe(0);
  });
});

// parseError
describe("parseError", () => {
  it("devuelve error desconocido si no hay error", () => {
    expect(parseError(null)).toBe("Error desconocido");
  });

  it("mapea row-level security al mensaje correcto", () => {
    expect(parseError(new Error("row-level security policy"))).toBe(
      "No tienes permiso para acceder a este chat.",
    );
  });

  it("mapea duplicate key al mensaje correcto", () => {
    expect(parseError(new Error("duplicate key value"))).toBe(
      "Ya eres miembro de este chat.", // era "miembros"
    );
  });

  it("mapea violates foreign key al mensaje correto", () => {
    expect(parseError(new Error("NetworkError occured"))).toBe(
      "Error de red. Verifica tu conexión.",
    );
  });

  it("mapea Failed to fetch al mensaje correcto", () => {
    expect(parseError(new Error("Failed to fetch"))).toBe(
      "Error de red. Verifica tu conexión.",
    );
  });

  it("pasa directo mensajes que incluyen 'inválido'", () => {
    const msg = "ID inválido"
    expect(parseError(new Error(msg))).toBe(msg);
  });

  it("devuelve error genérico para mensajes desconocidos", () => {
    expect(parseError(new Error("algún error raro"))).toBe(
      "Ocurrió un error inesperado.",
    );
  });
});

// assertFriendship
describe("assertFriendship", () => {
  it("no lanza error si son amigos", async () => {
    mockRpc.mockResolvedValueOnce({ data: true, error: null });
    await expect(assertFriendship(USER_A, USER_B)).resolves.toBeUndefined();
    expect(mockRpc).toHaveBeenCalledWith("assert_friendship_rpc", {
      user_a: USER_A,
      user_b: USER_B,
    });
  });

  it("lanza error si no son amigos (data false)", async () => {
    mockRpc.mockResolvedValueOnce({ data: false, error: null }); // era true
    await expect(assertFriendship(USER_A, USER_B)).rejects.toThrow(/amigos/i);
  });

  it("lanza error si el RPC falla", async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: new Error("RPC error") });
    await expect(assertFriendship(USER_A, USER_B)).rejects.toThrow("RPC error");
  });
});

// assertMembership
describe("assertMembership", () => {
  const setupMembership = (data: any) => {
    const mockMaybeSingleFn = jest.fn().mockResolvedValueOnce({ data });
    const mockEq2 = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingleFn });
    const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
    const mockSelectFn = jest.fn().mockReturnValue({ eq: mockEq1 });
    mockFrom.mockReturnValue({ select: mockSelectFn });
  };

  it("no lanza error si el usuario es miembro", async () => {
    setupMembership({ chat_members_id: "123" });
    await expect(assertMembership(CHAT_ID, USER_A)).resolves.toBeUndefined();
  });

  it("lanza error si el usuario no es miembro", async () => {
    setupMembership(null);
    await expect(assertMembership(CHAT_ID, USER_A)).rejects.toThrow(/miembro/i);
  });
});

// ─── findExistingDirectChat ───────────────────────────────────────────────────

describe("findExistingDirectChat", () => {
  it("devuelve el chat_id si existe un chat directo", async () => {
    mockRpc.mockResolvedValueOnce({ data: CHAT_ID, error: null });
    const result = await findExistingDirectChat(USER_A, USER_B);
    expect(result).toBe(CHAT_ID);
    expect(mockRpc).toHaveBeenCalledWith("find_direct_chat", {
      user_a: USER_A,
      user_b: USER_B,
    });
  });

  it("devuelve null si no existe chat directo", async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: null });
    const result = await findExistingDirectChat(USER_A, USER_B);
    expect(result).toBeNull();
  });

  it("lanza error si el RPC falla", async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: new Error("RPC fail") });
    await expect(findExistingDirectChat(USER_A, USER_B)).rejects.toThrow("RPC fail");
  });
});

// ─── getChatById ──────────────────────────────────────────────────────────────

describe("getChatById", () => {
  const mockChatData = {
    chat_id: CHAT_ID,
    is_group: false,
    group_name: null,
    created_by: USER_A,
    created_at: "2024-01-01T00:00:00Z",
    members: [
      {
        joined_at: "2024-01-01T00:00:00Z",
        user: {
          user_id: USER_B,
          full_name: "User B",
          username: "userb",
          profile_pic: null,
        },
      },
    ],
  };

  // chat query: .from("chat").select().eq().single()
  const setupChatQuery = (chatData: any, error: any = null) => {
    const mockSingleFn = jest.fn().mockResolvedValueOnce({ data: chatData, error });
    const mockEqFn = jest.fn().mockReturnValue({ single: mockSingleFn });
    const mockSelectFn = jest.fn().mockReturnValue({ eq: mockEqFn });
    return mockSelectFn;
  };

  // last message query: .select().eq().order().limit().maybeSingle()
  // unread query: .select().eq().eq().neq()
  const setupMessagesQueries = (lastMsg: any = null, count: number = 0) => {
    const mockMaybeSingleFn = jest.fn().mockResolvedValueOnce({ data: lastMsg, error: null });
    const mockLimitFn = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingleFn });
    const mockOrderFn = jest.fn().mockReturnValue({ limit: mockLimitFn });
    const mockEqLastMsg = jest.fn().mockReturnValue({ order: mockOrderFn });
    const mockSelectLastMsg = jest.fn().mockReturnValue({ eq: mockEqLastMsg });

    const mockNeqFn = jest.fn().mockResolvedValueOnce({ count, error: null });
    const mockEqUnread2 = jest.fn().mockReturnValue({ neq: mockNeqFn });
    const mockEqUnread1 = jest.fn().mockReturnValue({ eq: mockEqUnread2 });
    const mockSelectUnread = jest.fn().mockReturnValue({ eq: mockEqUnread1 });

    return { mockSelectLastMsg, mockSelectUnread };
  };

  it("devuelve null si hay error al obtener el chat", async () => {
    const mockSelectChat = setupChatQuery(null, new Error("Not found"));
    mockFrom.mockReturnValue({ select: mockSelectChat });

    const result = await getChatById(CHAT_ID, USER_A);
    expect(result).toBeNull();
  });

  it("devuelve el chat con miembros y last_message correctamente", async () => {
    const mockSelectChat = setupChatQuery(mockChatData);
    const { mockSelectLastMsg, mockSelectUnread } = setupMessagesQueries(
      {
        content: "Hola",
        sender_id: USER_B,
        created_at: "2024-01-01T01:00:00Z",
        sender: { username: "userb" },
      },
      3,
    );

    let msgCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "chat") return { select: mockSelectChat };
      if (table === "messages") {
        msgCallCount++;
        return { select: msgCallCount === 1 ? mockSelectLastMsg : mockSelectUnread };
      }
    });

    const result = await getChatById(CHAT_ID, USER_A);

    expect(result).not.toBeNull();
    expect(result!.chat_id).toBe(CHAT_ID);
    expect(result!.members).toHaveLength(1);
    expect(result!.members[0].username).toBe("userb");
    expect(result!.last_message).toEqual({
      content: "Hola",
      sender_id: USER_B,
      created_at: "2024-01-01T01:00:00Z",
      sender_username: "userb",
    });
    expect(result!.unread_count).toBe(3);
  });

  it("devuelve last_message null si no hay mensajes", async () => {
    const mockSelectChat = setupChatQuery(mockChatData);
    const { mockSelectLastMsg, mockSelectUnread } = setupMessagesQueries(null, 0);

    let msgCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "chat") return { select: mockSelectChat };
      if (table === "messages") {
        msgCallCount++;
        return { select: msgCallCount === 1 ? mockSelectLastMsg : mockSelectUnread };
      }
    });

    const result = await getChatById(CHAT_ID, USER_A);
    expect(result!.last_message).toBeNull();
    expect(result!.unread_count).toBe(0);
  });
});