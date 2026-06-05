import { supabase } from '@/__mocks__/supabaseMock';
import {
    addMemberToGroup,
    leaveGroup
} from "@/services/supabase/chat/chat.group"

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockSingle = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockDelete = jest.fn();
const mockFrom = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
  },
}));

jest.mock("@/services/supabase/helpers/validation", () => ({
  assertUUID: jest.fn(),
  getAuthUser: jest.fn(),
}));

jest.mock("@/services/supabase/chat/chat.helpers", () => ({
  assertFriendship: jest.fn(),
  assertMembership: jest.fn(),
  parseError: jest.fn((err: any) => err?.message ?? String(err)),
}));

import { getAuthUser, assertUUID } from "@/services/supabase/helpers/validation";
import { assertFriendship, assertMembership, parseError } from "@/services/supabase/chat/chat.helpers";

// ─── Constantes ──────────────────────────────────────────────────────────────

const CURRENT_USER = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const NEW_USER     = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const CHAT_ID      = "cccccccc-cccc-cccc-cccc-cccccccccccc";

beforeEach(() => {
  jest.clearAllMocks();
  (getAuthUser as jest.Mock).mockResolvedValue(CURRENT_USER);
  (parseError as jest.Mock).mockImplementation((err: any) => err?.message ?? String(err));
});

// ─── addMemberToGroup ─────────────────────────────────────────────────────────
describe("addMemberToGroup", () => {
  const setupChatQuery = (is_group: boolean | null) => {
    const mockSingleFn = jest.fn().mockResolvedValueOnce({
      data: is_group !== null ? { is_group } : null,
      error: null,
    });
    const mockEqFn = jest.fn().mockReturnValue({ single: mockSingleFn });
    const mockSelectFn = jest.fn().mockReturnValue({ eq: mockEqFn });
    return mockSelectFn;
  };

  it("añade un miembro correctamente a un grupo", async () => {
    const mockSelectFn = setupChatQuery(true);
    const mockInsertResult = jest.fn().mockResolvedValueOnce({ error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === "chat") return { select: mockSelectFn };
      if (table === "chat_members") return { insert: mockInsertResult };
    });

    const result = await addMemberToGroup(CHAT_ID, NEW_USER);

    expect(result.data).toBeNull();
    expect(result.error).toBeNull();
    expect(assertMembership).toHaveBeenCalledWith(CHAT_ID, CURRENT_USER);
    expect(assertFriendship).toHaveBeenCalledWith(CURRENT_USER, NEW_USER);
    expect(mockInsertResult).toHaveBeenCalledWith({
      chat_id: CHAT_ID,
      user_id: NEW_USER,
    });
  });

  it("devuelve error si el chat no es un grupo", async () => {
    const mockSelectFn = setupChatQuery(false);
    mockFrom.mockReturnValue({ select: mockSelectFn });

    const result = await addMemberToGroup(CHAT_ID, NEW_USER);

    expect(result.data).toBeNull();
    expect(result.error).toMatch(/grupos/i);
  });

  it("devuelve error si el chat no existe (data null)", async () => {
    const mockSelectFn = setupChatQuery(null);
    mockFrom.mockReturnValue({ select: mockSelectFn });

    const result = await addMemberToGroup(CHAT_ID, NEW_USER);

    expect(result.data).toBeNull();
    expect(result.error).toMatch(/grupos/i);
  });

  it("devuelve error si Supabase falla al insertar el miembro", async () => {
    const mockSelectFn = setupChatQuery(true);
    const mockInsertResult = jest.fn().mockResolvedValueOnce({ error: new Error("Insert failed") });

    mockFrom.mockImplementation((table: string) => {
      if (table === "chat") return { select: mockSelectFn };
      if (table === "chat_members") return { insert: mockInsertResult };
    });

    const result = await addMemberToGroup(CHAT_ID, NEW_USER);

    expect(result.data).toBeNull();
    expect(result.error).toBe("Insert failed");
  });

  it("llama a assertUUID para chatId y newUserId", async () => {
    const mockSelectFn = setupChatQuery(true);
    const mockInsertResult = jest.fn().mockResolvedValueOnce({ error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === "chat") return { select: mockSelectFn };
      if (table === "chat_members") return { insert: mockInsertResult };
    });

    await addMemberToGroup(CHAT_ID, NEW_USER);

    expect(assertUUID).toHaveBeenCalledWith(CHAT_ID, "chatId");
    expect(assertUUID).toHaveBeenCalledWith(NEW_USER, "ID de usuario");
  });
});

// ─── leaveGroup ───────────────────────────────────────────────────────────────

describe("leaveGroup", () => {
  const setupDeleteChain = (error: Error | null) => {
    const mockFinalEq = jest.fn().mockResolvedValueOnce({ error });
    const mockFirstEq = jest.fn().mockReturnValue({ eq: mockFinalEq });
    const mockDeleteFn = jest.fn().mockReturnValue({ eq: mockFirstEq });
    mockFrom.mockReturnValue({ delete: mockDeleteFn });
    return { mockDeleteFn, mockFirstEq, mockFinalEq };
  };

  it("sale del grupo correctamente", async () => {
    const { mockFirstEq, mockFinalEq } = setupDeleteChain(null);

    const result = await leaveGroup(CHAT_ID);

    expect(result.data).toBeNull();
    expect(result.error).toBeNull();
    expect(mockFirstEq).toHaveBeenCalledWith("chat_id", CHAT_ID);
    expect(mockFinalEq).toHaveBeenCalledWith("user_id", CURRENT_USER);
  });

  it("devuelve error si Supabase falla al eliminar", async () => {
    setupDeleteChain(new Error("Delete failed"));

    const result = await leaveGroup(CHAT_ID);

    expect(result.data).toBeNull();
    expect(result.error).toBe("Delete failed");
  });

  it("llama a assertUUID con el chatId", async () => {
    setupDeleteChain(null);

    await leaveGroup(CHAT_ID);

    expect(assertUUID).toHaveBeenCalledWith(CHAT_ID, "chatId");
  });

  it("usa el usuario autenticado para el delete", async () => {
    const { mockFinalEq } = setupDeleteChain(null);

    await leaveGroup(CHAT_ID);

    expect(mockFinalEq).toHaveBeenCalledWith("user_id", CURRENT_USER);
  });
});