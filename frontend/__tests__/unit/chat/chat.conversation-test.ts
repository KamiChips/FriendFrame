import { supabase } from '@/__mocks__/supabaseMock';
import {
    createDirectChat, 
    createGroupChat,
    getConversations,
} from '@/services/supabase/chat/chat.conversation'

// Mocks
const mockSingle = jest.fn();
const mockSelect = jest.fn(() => ({ single: mockSingle }));
const mockInsert = jest.fn(() => ({ select: mockSelect, error: null }));
const mockIn = jest.fn();
const mockFrom = jest.fn();
const mockRpc = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
    supabase: {
        from: (...args: any[]) => mockFrom(...args),
        rpc: (...args: any[]) => mockRpc(...args),
    },
}));

jest.mock("@/services/supabase/helpers/validation", () => ({
  assertUUID: jest.fn(),
  getAuthUser: jest.fn(),
}));

jest.mock("@/services/supabase/chat/chat.helpers", () => ({
  assertFriendship: jest.fn(),
  assertUUIDs: jest.fn(),
  findExistingDirectChat: jest.fn(),
  getChatById: jest.fn(),
  parseError: jest.fn((err: any) => err?.message ?? String(err)),
}));

import { getAuthUser } from '@/services/supabase/helpers/validation';
import {
  assertFriendship,
  findExistingDirectChat,
  getChatById,
  parseError,
} from '@/services/supabase/chat/chat.helpers';

// ─── Helpers de setup ────────────────────────────────────────────────────────

const CURRENT_USER = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const TARGET_USER  = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const CHAT_ID      = "cccccccc-cccc-cccc-cccc-cccccccccccc";

const mockChat = {
  chat_id: CHAT_ID,
  is_group: false,
  group_name: null,
  created_by: CURRENT_USER,
  created_at: "2024-01-01T00:00:00Z",
  members: [],
  last_message: null,
  unread_count: 0,
};

beforeEach(() => {
  jest.clearAllMocks();
  (getAuthUser as jest.Mock).mockResolvedValue(CURRENT_USER);
  (parseError as jest.Mock).mockImplementation((err: any) => err?.message ?? String(err));
});

// ─── createDirectChat ────────────────────────────────────────────────────────

describe("createDirectChat", () => {
  it("devuelve error si el targetUserId es el mismo usuario", async () => {
    const result = await createDirectChat(CURRENT_USER);
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/contigo mismo/i);
  });

  it("abre el chat existente si ya existe uno con ese usuario", async () => {
    (findExistingDirectChat as jest.Mock).mockResolvedValue(CHAT_ID);
    (getChatById as jest.Mock).mockResolvedValue(mockChat);

    const result = await createDirectChat(TARGET_USER);

    expect(findExistingDirectChat).toHaveBeenCalledWith(CURRENT_USER, TARGET_USER);
    expect(result.data).toEqual(mockChat);
    expect(result.error).toBeNull();
  });

  it("crea un chat nuevo si no existe uno previo", async () => {
    (findExistingDirectChat as jest.Mock).mockResolvedValue(null);
    (getChatById as jest.Mock).mockResolvedValue(mockChat);

    mockSingle.mockResolvedValueOnce({ data: { chat_id: CHAT_ID }, error: null });
    const mockMembersInsert = jest.fn().mockResolvedValueOnce({ error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === "chat") return { insert: mockInsert };
      if (table === "chat_members") return { insert: mockMembersInsert };
    });
    mockInsert.mockReturnValue({ select: mockSelect, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });

    const result = await createDirectChat(TARGET_USER);

    expect(result.data).toEqual(mockChat);
    expect(result.error).toBeNull();
    expect(mockMembersInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ user_id: CURRENT_USER }),
        expect.objectContaining({ user_id: TARGET_USER }),
      ]),
    );
  });

  it("propaga el error de Supabase al insertar el chat", async () => {
    (findExistingDirectChat as jest.Mock).mockResolvedValue(null);

    mockSingle.mockResolvedValueOnce({ data: null, error: new Error("DB error") });
    mockFrom.mockReturnValue({ insert: mockInsert });
    mockInsert.mockReturnValue({ select: mockSelect, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });

    const result = await createDirectChat(TARGET_USER);

    expect(result.data).toBeNull();
    expect(result.error).toBe("DB error");
  });

  it("llama a assertFriendship antes de crear el chat", async () => {
    (findExistingDirectChat as jest.Mock).mockResolvedValue(null);
    mockSingle.mockResolvedValueOnce({ data: { chat_id: CHAT_ID }, error: null });
    mockFrom.mockReturnValue({ insert: jest.fn().mockReturnValue({ select: mockSelect, error: null }) });
    mockSelect.mockReturnValue({ single: mockSingle });
    (getChatById as jest.Mock).mockResolvedValue(mockChat);

    await createDirectChat(TARGET_USER);

    expect(assertFriendship).toHaveBeenCalledWith(CURRENT_USER, TARGET_USER);
  });
});

// ─── createGroupChat ─────────────────────────────────────────────────────────

describe("createGroupChat", () => {
  const MEMBER_1 = "dddddddd-dddd-dddd-dddd-dddddddddddd";
  const MEMBER_2 = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";

  it("devuelve error si el nombre del grupo está vacío", async () => {
    const result = await createGroupChat("  ", [MEMBER_1]);
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/nombre/i);
  });

  it("devuelve error si no se agregan miembros", async () => {
    const result = await createGroupChat("Mi grupo", []);
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/miembro/i);
  });

  it("excluye al creador de la lista de miembros si aparece en ella", async () => {
    const mockGroupChat = { ...mockChat, is_group: true, group_name: "Mi grupo" };
    (getChatById as jest.Mock).mockResolvedValue(mockGroupChat);

    const mockMembersInsert = jest.fn().mockResolvedValueOnce({ error: null });
    mockSingle.mockResolvedValueOnce({ data: { chat_id: CHAT_ID }, error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === "chat") return { insert: mockInsert };
      if (table === "chat_members") return { insert: mockMembersInsert };
    });
    mockInsert.mockReturnValue({ select: mockSelect, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });

    await createGroupChat("Mi grupo", [MEMBER_1, CURRENT_USER]);

    const insertedMembers: any[] = mockMembersInsert.mock.calls[0][0];
    const userIds = insertedMembers.map((m) => m.user_id);
    expect(userIds.filter((id) => id === CURRENT_USER).length).toBe(1);
  });

  it("crea el grupo correctamente con miembros válidos", async () => {
    const mockGroupChat = { ...mockChat, is_group: true, group_name: "Team" };
    (getChatById as jest.Mock).mockResolvedValue(mockGroupChat);

    const mockMembersInsert = jest.fn().mockResolvedValueOnce({ error: null });
    mockSingle.mockResolvedValueOnce({ data: { chat_id: CHAT_ID }, error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === "chat") return { insert: mockInsert };
      if (table === "chat_members") return { insert: mockMembersInsert };
    });
    mockInsert.mockReturnValue({ select: mockSelect, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });

    const result = await createGroupChat("Team", [MEMBER_1, MEMBER_2]);

    expect(result.data).toEqual(mockGroupChat);
    expect(result.error).toBeNull();
    expect(assertFriendship).toHaveBeenCalledTimes(2);
  });

  it("devuelve error si Supabase falla al insertar el grupo", async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: new Error("Insert failed") });
    mockFrom.mockReturnValue({ insert: mockInsert });
    mockInsert.mockReturnValue({ select: mockSelect, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });

    const result = await createGroupChat("Team", [MEMBER_1]);

    expect(result.data).toBeNull();
    expect(result.error).toBe("Insert failed");
  });
});

// ─── getConversations ────────────────────────────────────────────────────────

describe("getConversations", () => {
  const mockRows = [
    {
      chat_id: CHAT_ID,
      is_group: false,
      group_name: null,
      created_by: CURRENT_USER,
      created_at: "2024-01-01T00:00:00Z",
      last_msg_content: "Hola",
      last_msg_sender: TARGET_USER,
      last_msg_at: "2024-01-01T01:00:00Z",
      last_msg_username: "targetuser",
      unread_count: 2,
    },
  ];

  const mockMembers = [
    {
      chat_id: CHAT_ID,
      joined_at: "2024-01-01T00:00:00Z",
      user: {
        user_id: TARGET_USER,
        full_name: "Target User",
        username: "targetuser",
        profile_pic: null,
      },
    },
  ];

  it("devuelve lista vacía si no hay chats", async () => {
    mockRpc.mockResolvedValueOnce({ data: [], error: null });
    const result = await getConversations();
    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });

  it("devuelve los chats con miembros y last_message correctamente mapeados", async () => {
    mockRpc.mockResolvedValueOnce({ data: mockRows, error: null });
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValueOnce({ data: mockMembers, error: null }),
      }),
    });

    const result = await getConversations();

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);

    const chat = result.data![0];
    expect(chat.chat_id).toBe(CHAT_ID);
    expect(chat.unread_count).toBe(2);
    expect(chat.last_message).toEqual({
      content: "Hola",
      sender_id: TARGET_USER,
      created_at: "2024-01-01T01:00:00Z",
      sender_username: "targetuser",
    });
    expect(chat.members).toHaveLength(1);
    expect(chat.members[0].username).toBe("targetuser");
  });

  it("mapea last_message como null si no hay mensajes", async () => {
    const rowsWithoutMsg = [{ ...mockRows[0], last_msg_content: null }];
    mockRpc.mockResolvedValueOnce({ data: rowsWithoutMsg, error: null });
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValueOnce({ data: [], error: null }),
      }),
    });

    const result = await getConversations();
    expect(result.data![0].last_message).toBeNull();
  });

  it("devuelve error si falla el RPC", async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: new Error("RPC error") });
    const result = await getConversations();
    expect(result.data).toBeNull();
    expect(result.error).toBe("RPC error");
  });

  it("devuelve error si falla la query de miembros", async () => {
    mockRpc.mockResolvedValueOnce({ data: mockRows, error: null });
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValueOnce({ data: null, error: new Error("Members error") }),
      }),
    });

    const result = await getConversations();
    expect(result.data).toBeNull();
    expect(result.error).toBe("Members error");
  });
});