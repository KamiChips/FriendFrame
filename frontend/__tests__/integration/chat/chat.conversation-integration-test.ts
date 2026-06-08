import {
  createDirectChat,
  createGroupChat,
  getConversations,
} from "@/services/supabase/chat/chat.conversation";

// UUIDs de prueba
const ME       = "aaaaaaaa-0000-0000-0000-000000000001";
const FRIEND   = "bbbbbbbb-0000-0000-0000-000000000002";
const STRANGER = "cccccccc-0000-0000-0000-000000000003";
const CHAT_ID  = "dddddddd-0000-0000-0000-000000000004";

// Mocks de módulos
jest.mock("@/lib/supabase/client", () => ({
    supabase: {
        from: jest.fn(),
        rpc: jest.fn(),
    },
}));

jest.mock("@/services/supabase/helpers/validation", () => ({
    assertUUID: jest.fn(),
    // Usar el literal porque ME tampoco existe aún en el scope del factory
    getAuthUser: jest.fn().mockResolvedValue("aaaaaaaa-0000-0000-0000-000000000001"),
}));

jest.mock("@/services/supabase/chat/chat.helpers", () => ({
    assertFriendship:       jest.fn().mockResolvedValue(undefined),
    assertUUIDs:            jest.fn(),
    findExistingDirectChat: jest.fn().mockResolvedValue(null),
    getChatById:            jest.fn(), // se configura en beforeEach
    parseError:             jest.fn((err: any) =>
        typeof err === "string" ? err : err?.message ?? "Error desconocido"
    ),
}));

// Imports post-mock 
import { supabase } from "@/lib/supabase/client";
import { getAuthUser } from "@/services/supabase/helpers/validation";
import {
    assertFriendship,
    findExistingDirectChat,
    getChatById,
} from "@/services/supabase/chat/chat.helpers";
import { MAX_GROUP_MEMBERS } from "@/services/supabase/chat/chat.types";

// Fixtures (definidos después del bloque de jest.mock) 
const MOCK_CHAT = {
    chat_id:      CHAT_ID,
    is_group:     false,
    group_name:   null,
    created_by:   ME,
    created_at:   "2024-01-01T00:00:00Z",
    members: [
        { user_id: ME,     full_name: "Yo",    username: "yo",    profile_pic: null, joined_at: "2024-01-01" },
        { user_id: FRIEND, full_name: "Amigo", username: "amigo", profile_pic: null, joined_at: "2024-01-01" },
    ],
    last_message:  null,
    unread_count:  0,
};

// Helper: configura supabase.from() con resultados por tabla
function mockSupabaseFrom(results: Record<string, { data: any; error: any }>) {
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
        const r = results[table] ?? { data: null, error: null };
        return {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(r),
        in:     jest.fn().mockResolvedValue(r),
        };
    });
}

// createDirectChat
describe("createDirectChat", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Configurar getChatById aquí, donde MOCK_CHAT ya existe
        (getChatById as jest.Mock).mockResolvedValue(MOCK_CHAT);
    });

    it("retorna error si el targetUserId es el mismo usuario", async () => {
        const { data, error } = await createDirectChat(ME);

        expect(data).toBeNull();
        expect(error).toMatch(/contigo mismo/i);
    });

    it("devuelve el chat existente si ya existe uno directo", async () => {
        (findExistingDirectChat as jest.Mock).mockResolvedValueOnce(CHAT_ID);

        const { data, error } = await createDirectChat(FRIEND);

        expect(error).toBeNull();
        expect(data?.chat_id).toBe(CHAT_ID);
        // No se tocó la DB para crear nada nuevo
        expect(supabase.from).not.toHaveBeenCalled();
    });

    it("crea un chat nuevo cuando no existe uno previo", async () => {
        (findExistingDirectChat as jest.Mock).mockResolvedValueOnce(null);

        mockSupabaseFrom({
        chat:         { data: { chat_id: CHAT_ID }, error: null },
        chat_members: { data: null, error: null },
        });

        const { data, error } = await createDirectChat(FRIEND);

        expect(error).toBeNull();
        expect(data?.chat_id).toBe(CHAT_ID);
        expect(assertFriendship).toHaveBeenCalledWith(ME, FRIEND);
    });

    it("retorna error si Supabase falla al insertar el chat", async () => {
        (findExistingDirectChat as jest.Mock).mockResolvedValueOnce(null);

        mockSupabaseFrom({
        chat: { data: null, error: { message: "DB error" } },
        });

        const { data, error } = await createDirectChat(FRIEND);

        expect(data).toBeNull();
        expect(error).toBeTruthy();
    });

    it("retorna error si la inserción de miembros falla", async () => {
        (findExistingDirectChat as jest.Mock).mockResolvedValueOnce(null);

        (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === "chat") {
            return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { chat_id: CHAT_ID }, error: null }),
            };
        }
        return {
            insert: jest.fn().mockResolvedValue({ data: null, error: { message: "members error" } }),
        };
        });

        const { data, error } = await createDirectChat(FRIEND);

        expect(data).toBeNull();
        expect(error).toBeTruthy();
    });

    it("verifica la amistad antes de crear el chat", async () => {
        (findExistingDirectChat as jest.Mock).mockResolvedValueOnce(null);
        mockSupabaseFrom({
        chat:         { data: { chat_id: CHAT_ID }, error: null },
        chat_members: { data: null, error: null },
        });

        await createDirectChat(FRIEND);

        expect(assertFriendship).toHaveBeenCalledTimes(1);
        expect(assertFriendship).toHaveBeenCalledWith(ME, FRIEND);
    });
});

// createGroupChat
describe("createGroupChat", () => {
    const GROUP_ID = "eeeeeeee-0000-0000-0000-000000000005";
    const MEMBER_2 = "ffffffff-0000-0000-0000-000000000006";

    const MOCK_GROUP = {
        ...MOCK_CHAT,
        chat_id:    GROUP_ID,
        is_group:   true,
        group_name: "Los amigos",
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (getChatById as jest.Mock).mockResolvedValue(MOCK_GROUP);
    });

    it("retorna error si el nombre está vacío", async () => {
        const { data, error } = await createGroupChat("   ", [FRIEND]);

        expect(data).toBeNull();
        expect(error).toMatch(/nombre/i);
    });

    it("retorna error si no se agregan miembros", async () => {
        const { data, error } = await createGroupChat("Grupo válido", []);

        expect(data).toBeNull();
        expect(error).toMatch(/miembro/i);
    });

    it("retorna error si se supera el máximo de miembros (MAX_GROUP_MEMBERS - 1)", async () => {
        const tooMany = Array.from({ length: MAX_GROUP_MEMBERS }, (_, i) => {
        const hex = i.toString(16).padStart(8, "0");
        return `${hex}-0000-0000-0000-000000000000`;
        });

        const { data, error } = await createGroupChat("Grupo enorme", tooMany);

        expect(data).toBeNull();
        expect(error).toMatch(/máximo/i);
    });

    it("crea el grupo correctamente con miembros válidos", async () => {
        mockSupabaseFrom({
        chat:         { data: { chat_id: GROUP_ID }, error: null },
        chat_members: { data: null, error: null },
        });

        const { data, error } = await createGroupChat("Los amigos", [FRIEND, MEMBER_2]);

        expect(error).toBeNull();
        expect(data?.is_group).toBe(true);
        expect(data?.group_name).toBe("Los amigos");
    });

    it("excluye al creador si está duplicado en la lista de miembros", async () => {
        mockSupabaseFrom({
        chat:         { data: { chat_id: GROUP_ID }, error: null },
        chat_members: { data: null, error: null },
        });

        await createGroupChat("Grupo dedup", [ME, FRIEND]);

        // assertFriendship solo debe llamarse con FRIEND, nunca ME con ME
        expect(assertFriendship).not.toHaveBeenCalledWith(ME, ME);
        expect(assertFriendship).toHaveBeenCalledWith(ME, FRIEND);
    });

    it("verifica amistad en paralelo con todos los miembros", async () => {
        mockSupabaseFrom({
        chat:         { data: { chat_id: GROUP_ID }, error: null },
        chat_members: { data: null, error: null },
        });

        await createGroupChat("Grupo paralelo", [FRIEND, MEMBER_2]);

        expect(assertFriendship).toHaveBeenCalledTimes(2);
    });

    it("retorna error si falla la verificación de amistad con algún miembro", async () => {
        (assertFriendship as jest.Mock).mockRejectedValueOnce(new Error("No son amigos"));

        const { data, error } = await createGroupChat("Grupo fallido", [STRANGER]);

        expect(data).toBeNull();
        expect(error).toMatch(/amigos/i);
    });
});

// getConversations
describe("getConversations", () => {
    const RPC_ROWS = [
        {
        chat_id:          CHAT_ID,
        is_group:         false,
        group_name:       null,
        created_by:       ME,
        created_at:       "2024-01-01T00:00:00Z",
        last_msg_content: "Hola!",
        last_msg_sender:  FRIEND,
        last_msg_at:      "2024-01-02T10:00:00Z",
        last_msg_username:"amigo",
        unread_count:     3,
        },
    ];

    const MEMBERS_ROWS = [
        {
        chat_id:   CHAT_ID,
        joined_at: "2024-01-01",
        user: { user_id: ME,     full_name: "Yo",    username: "yo",    profile_pic: null },
        },
        {
        chat_id:   CHAT_ID,
        joined_at: "2024-01-01",
        user: { user_id: FRIEND, full_name: "Amigo", username: "amigo", profile_pic: null },
        },
    ];

    beforeEach(() => jest.clearAllMocks());

    it("retorna lista vacía si no hay conversaciones", async () => {
        (supabase.rpc as jest.Mock).mockResolvedValueOnce({ data: [], error: null });

        const { data, error } = await getConversations();

        expect(error).toBeNull();
        expect(data).toEqual([]);
    });

    it("mapea correctamente los campos de la RPC al tipo Chat", async () => {
        (supabase.rpc as jest.Mock).mockResolvedValueOnce({ data: RPC_ROWS, error: null });
        (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        in:     jest.fn().mockResolvedValue({ data: MEMBERS_ROWS, error: null }),
        });

        const { data, error } = await getConversations();

        expect(error).toBeNull();
        expect(data).toHaveLength(1);

        const chat = data![0];
        expect(chat.chat_id).toBe(CHAT_ID);
        expect(chat.unread_count).toBe(3);
        expect(chat.last_message?.content).toBe("Hola!");
        expect(chat.last_message?.sender_username).toBe("amigo");
        expect(chat.members).toHaveLength(2);
    });

    it("retorna last_message null cuando no hay mensajes en el chat", async () => {
        const rowSinMensaje = { ...RPC_ROWS[0], last_msg_content: null };
        (supabase.rpc as jest.Mock).mockResolvedValueOnce({ data: [rowSinMensaje], error: null });
        (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        in:     jest.fn().mockResolvedValue({ data: MEMBERS_ROWS, error: null }),
        });

        const { data } = await getConversations();

        expect(data![0].last_message).toBeNull();
    });

    it("unread_count siempre es número (incluso si RPC devuelve null)", async () => {
        const rowConNull = { ...RPC_ROWS[0], unread_count: null };
        (supabase.rpc as jest.Mock).mockResolvedValueOnce({ data: [rowConNull], error: null });
        (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        in:     jest.fn().mockResolvedValue({ data: MEMBERS_ROWS, error: null }),
        });

        const { data } = await getConversations();

        expect(typeof data![0].unread_count).toBe("number");
        expect(data![0].unread_count).toBe(0);
    });

    it("retorna error si la RPC falla", async () => {
        (supabase.rpc as jest.Mock).mockResolvedValueOnce({ data: null, error: { message: "RPC error" } });

        const { data, error } = await getConversations();

        expect(data).toBeNull();
        expect(error).toBeTruthy();
    });

    it("retorna error si falla la query de miembros", async () => {
        (supabase.rpc as jest.Mock).mockResolvedValueOnce({ data: RPC_ROWS, error: null });
        (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        in:     jest.fn().mockResolvedValue({ data: null, error: { message: "members error" } }),
        });

        const { data, error } = await getConversations();

        expect(data).toBeNull();
        expect(error).toBeTruthy();
    });

    it("agrupa correctamente los miembros cuando hay múltiples chats", async () => {
        const CHAT_ID_2 = "11111111-0000-0000-0000-000000000001";
        const FRIEND_2  = "22222222-0000-0000-0000-000000000002";

        const rows = [
        { ...RPC_ROWS[0] },
        { ...RPC_ROWS[0], chat_id: CHAT_ID_2, last_msg_content: null, unread_count: 0 },
        ];

        const members = [
        ...MEMBERS_ROWS,
        { chat_id: CHAT_ID_2, joined_at: "2024-01-01",
            user: { user_id: ME,       full_name: "Yo",     username: "yo",     profile_pic: null } },
        { chat_id: CHAT_ID_2, joined_at: "2024-01-01",
            user: { user_id: FRIEND_2, full_name: "Amigo2", username: "amigo2", profile_pic: null } },
        ];

        (supabase.rpc as jest.Mock).mockResolvedValueOnce({ data: rows, error: null });
        (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        in:     jest.fn().mockResolvedValue({ data: members, error: null }),
        });

        const { data } = await getConversations();

        expect(data).toHaveLength(2);
        expect(data!.find((c) => c.chat_id === CHAT_ID)?.members).toHaveLength(2);
        expect(data!.find((c) => c.chat_id === CHAT_ID_2)?.members).toHaveLength(2);
    });
});