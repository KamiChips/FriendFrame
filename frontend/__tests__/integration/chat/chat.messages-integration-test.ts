const mockFrom = jest.fn();
const mockRpc  = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
    supabase: {
        from: (...args: any[]) => mockFrom(...args),
        rpc:  (...args: any[]) => mockRpc(...args),
    },
}));

jest.mock("@/services/supabase/helpers/validation", () => ({
    assertUUID:  jest.fn(),
    assertUUIDs: jest.fn(),
    getAuthUser: jest.fn().mockResolvedValue("aaaaaaaa-0000-0000-0000-000000000001"),
}));

jest.mock("@/services/supabase/chat/chat.helpers", () => ({
    assertMembership:    jest.fn().mockResolvedValue(undefined),
    assertUUIDs:         jest.fn(),
    markMessagesAsRead:  jest.fn(),
    normalizePagination: jest.fn().mockReturnValue({ from: 0, to: 19 }),
    notifyMembers:       jest.fn(),
    parseError:          jest.fn((err: any) => err?.message ?? String(err)),
}));

// Imports post-mock 
import {
    sendMessage,
    getMessages,
    shareToChat,
    getTotalUnreadMessages,
} from "@/services/supabase/chat/chat.messages";

import { assertUUID, getAuthUser } from "@/services/supabase/helpers/validation";
import {
    assertMembership,
    assertUUIDs,
    markMessagesAsRead,
    normalizePagination,
    notifyMembers,
    parseError,
} from "@/services/supabase/chat/chat.helpers";
import { MAX_MESSAGE_LEN, MAX_SHARE_CHATS } from "@/services/supabase/chat/chat.types";

// Constantes 
const ME      = "aaaaaaaa-0000-0000-0000-000000000001";
const CHAT_ID = "bbbbbbbb-0000-0000-0000-000000000002";
const POST_ID = "cccccccc-0000-0000-0000-000000000003";
const FRAG_ID = "dddddddd-0000-0000-0000-000000000004";
const MSG_ID  = "eeeeeeee-0000-0000-0000-000000000005";

// Fixtures 
const MOCK_MESSAGE = {
    message_id:  MSG_ID,
    chat_id:     CHAT_ID,
    sender_id:   ME,
    content:     "Hola!",
    is_read:     false,
    created_at:  "2024-01-01T10:00:00Z",
    sender: { user_id: ME, username: "yo", full_name: "Yo", profile_pic: null },
};

// Helpers de setup 
/** Cadena insert → select → single para la tabla "messages" */
function setupMessageInsert(data: object | null, error: any = null) {
    const singleFn = jest.fn().mockResolvedValueOnce({ data, error });
    const selectFn = jest.fn().mockReturnValue({ single: singleFn });
    const insertFn = jest.fn().mockReturnValue({ select: selectFn });
    mockFrom.mockReturnValue({ insert: insertFn });
    return { insertFn, selectFn, singleFn };
}

/** Cadena select → eq → order → range para getMessages */
function setupMessageSelect(data: any[], error: any = null) {
    const rangeFn = jest.fn().mockResolvedValueOnce({ data, error });
    const orderFn = jest.fn().mockReturnValue({ range: rangeFn });
    const eqFn    = jest.fn().mockReturnValue({ order: orderFn });
    const selFn   = jest.fn().mockReturnValue({ eq: eqFn });
    mockFrom.mockReturnValue({ select: selFn });
    return { selFn, eqFn, orderFn, rangeFn };
}
 
// sendMessage 
describe("sendMessage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (getAuthUser as jest.Mock).mockResolvedValue(ME);
        (parseError as jest.Mock).mockImplementation((err: any) => err?.message ?? String(err));
    });

    it("envía un mensaje correctamente y retorna el mensaje creado", async () => {
        setupMessageInsert(MOCK_MESSAGE);

        const { data, error } = await sendMessage(CHAT_ID, "Hola!");

        expect(error).toBeNull();
        expect(data?.content).toBe("Hola!");
        expect(data?.shared_post).toBeNull();
        expect(data?.shared_fragment).toBeNull();
    });

    it("retorna error si el contenido está vacío", async () => {
        const { data, error } = await sendMessage(CHAT_ID, "   ");

        expect(data).toBeNull();
        expect(error).toMatch(/vacío/i);
    });

    it("retorna error si el mensaje supera MAX_MESSAGE_LEN caracteres", async () => {
        const tooLong = "a".repeat(MAX_MESSAGE_LEN + 1);

        const { data, error } = await sendMessage(CHAT_ID, tooLong);

        expect(data).toBeNull();
        expect(error).toMatch(/superar/i);
    });

    it("verifica membresía antes de insertar", async () => {
        setupMessageInsert(MOCK_MESSAGE);

        await sendMessage(CHAT_ID, "Hola!");

        expect(assertMembership).toHaveBeenCalledWith(CHAT_ID, ME);
    });

    it("retorna error si el usuario no es miembro del chat", async () => {
        (assertMembership as jest.Mock).mockRejectedValueOnce(new Error("No eres miembro de este chat."));

        const { data, error } = await sendMessage(CHAT_ID, "Hola!");

        expect(data).toBeNull();
        expect(error).toMatch(/miembro/i);
    });

    it("inserta el mensaje con los campos correctos (trim aplicado)", async () => {
        const { insertFn } = setupMessageInsert(MOCK_MESSAGE);

        await sendMessage(CHAT_ID, "  Hola!  ");

        expect(insertFn).toHaveBeenCalledWith(
        expect.objectContaining({
            chat_id:   CHAT_ID,
            sender_id: ME,
            content:   "Hola!",
            is_read:   false,
        })
        );
    });

    it("llama a notifyMembers después de insertar exitosamente", async () => {
        setupMessageInsert(MOCK_MESSAGE);

        await sendMessage(CHAT_ID, "Hola!");

        expect(notifyMembers).toHaveBeenCalledWith(CHAT_ID, ME, MOCK_MESSAGE.message_id);
    });

    it("no llama a notifyMembers si Supabase falla al insertar", async () => {
        setupMessageInsert(null, new Error("Insert failed"));

        await sendMessage(CHAT_ID, "Hola!");

        expect(notifyMembers).not.toHaveBeenCalled();
    });

    it("retorna error si Supabase falla al insertar el mensaje", async () => {
        setupMessageInsert(null, new Error("DB error"));

        const { data, error } = await sendMessage(CHAT_ID, "Hola!");

        expect(data).toBeNull();
        expect(error).toBeTruthy();
    });

    it("valida el UUID del chatId", async () => {
        setupMessageInsert(MOCK_MESSAGE);

        await sendMessage(CHAT_ID, "Hola!");

        expect(assertUUID).toHaveBeenCalledWith(CHAT_ID, "chatId");
    });
});
 
// getMessages 
describe("getMessages", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (getAuthUser as jest.Mock).mockResolvedValue(ME);
        (normalizePagination as jest.Mock).mockReturnValue({ from: 0, to: 19 });
        (parseError as jest.Mock).mockImplementation((err: any) => err?.message ?? String(err));
    });

    it("retorna lista de mensajes correctamente", async () => {
        setupMessageSelect([MOCK_MESSAGE]);

        const { data, error } = await getMessages(CHAT_ID);

        expect(error).toBeNull();
        expect(data).toHaveLength(1);
        expect(data![0].content).toBe("Hola!");
    });

    it("agrega shared_post y shared_fragment null a cada mensaje", async () => {
        setupMessageSelect([MOCK_MESSAGE, MOCK_MESSAGE]);

        const { data } = await getMessages(CHAT_ID);

        data!.forEach((m) => {
        expect(m.shared_post).toBeNull();
        expect(m.shared_fragment).toBeNull();
        });
    });

    it("retorna array vacío si no hay mensajes", async () => {
        setupMessageSelect([]);

        const { data, error } = await getMessages(CHAT_ID);

        expect(error).toBeNull();
        expect(data).toEqual([]);
    });

    it("retorna array vacío si data es null", async () => {
        const rangeFn = jest.fn().mockResolvedValueOnce({ data: null, error: null });
        const orderFn = jest.fn().mockReturnValue({ range: rangeFn });
        const eqFn    = jest.fn().mockReturnValue({ order: orderFn });
        const selFn   = jest.fn().mockReturnValue({ eq: eqFn });
        mockFrom.mockReturnValue({ select: selFn });

        const { data } = await getMessages(CHAT_ID);

        expect(data).toEqual([]);
    });

    it("llama a normalizePagination con los params correctos", async () => {
        setupMessageSelect([]);

        await getMessages(CHAT_ID, { page: 2, limit: 10 });

        expect(normalizePagination).toHaveBeenCalledWith(2, 10);
    });

    it("usa el rango de normalizePagination en la query", async () => {
        (normalizePagination as jest.Mock).mockReturnValue({ from: 20, to: 29 });
        const { rangeFn } = setupMessageSelect([]);

        await getMessages(CHAT_ID, { page: 2, limit: 10 });

        expect(rangeFn).toHaveBeenCalledWith(20, 29);
    });

    it("filtra por chat_id correcto", async () => {
        const { eqFn } = setupMessageSelect([]);

        await getMessages(CHAT_ID);

        expect(eqFn).toHaveBeenCalledWith("chat_id", CHAT_ID);
    });

    it("ordena por created_at descendente", async () => {
        const { orderFn } = setupMessageSelect([]);

        await getMessages(CHAT_ID);

        expect(orderFn).toHaveBeenCalledWith("created_at", { ascending: false });
    });

    it("llama a markMessagesAsRead después de obtener los mensajes", async () => {
        setupMessageSelect([MOCK_MESSAGE]);

        await getMessages(CHAT_ID);

        expect(markMessagesAsRead).toHaveBeenCalledWith(CHAT_ID, ME);
    });

    it("no llama a markMessagesAsRead si Supabase falla", async () => {
        const rangeFn = jest.fn().mockResolvedValueOnce({ data: null, error: new Error("DB error") });
        const orderFn = jest.fn().mockReturnValue({ range: rangeFn });
        const eqFn    = jest.fn().mockReturnValue({ order: orderFn });
        const selFn   = jest.fn().mockReturnValue({ eq: eqFn });
        mockFrom.mockReturnValue({ select: selFn });

        await getMessages(CHAT_ID);

        expect(markMessagesAsRead).not.toHaveBeenCalled();
    });

    it("retorna error si Supabase falla", async () => {
        const rangeFn = jest.fn().mockResolvedValueOnce({ data: null, error: new Error("DB error") });
        const orderFn = jest.fn().mockReturnValue({ range: rangeFn });
        const eqFn    = jest.fn().mockReturnValue({ order: orderFn });
        const selFn   = jest.fn().mockReturnValue({ eq: eqFn });
        mockFrom.mockReturnValue({ select: selFn });

        const { data, error } = await getMessages(CHAT_ID);

        expect(data).toBeNull();
        expect(error).toBeTruthy();
    });

    it("valida el UUID del chatId", async () => {
        setupMessageSelect([]);

        await getMessages(CHAT_ID);

        expect(assertUUID).toHaveBeenCalledWith(CHAT_ID, "chatId");
    });
});

// shareToChat
describe("shareToChat", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (getAuthUser as jest.Mock).mockResolvedValue(ME);
        (assertMembership as jest.Mock).mockResolvedValue(undefined);
        (parseError as jest.Mock).mockImplementation((err: any) => err?.message ?? String(err));
    });

    /** Configura mockFrom para shares + messages insert exitoso */
    function setupShareInserts() {
        mockFrom.mockImplementation((table: string) => {
        if (table === "posts") {
            return {
            select: jest.fn().mockReturnThis(),
            eq:     jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
                data: { description: "Descripción del post" }, error: null,
            }),
            };
        }
        if (table === "fragments") {
            return {
            select: jest.fn().mockReturnThis(),
            eq:     jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
                data: { content: "Contenido del fragment" }, error: null,
            }),
            };
        }
        // shares y messages
        return { insert: jest.fn().mockResolvedValue({ error: null }) };
        });
    }

    it("comparte un post correctamente y retorna shared=1, failed=0", async () => {
        setupShareInserts();

        const { data, error } = await shareToChat({ postId: POST_ID }, [CHAT_ID]);

        expect(error).toBeNull();
        expect(data?.shared).toBe(1);
        expect(data?.failed).toBe(0);
    });

    it("comparte un fragment correctamente", async () => {
        setupShareInserts();

        const { data, error } = await shareToChat({ fragmentId: FRAG_ID }, [CHAT_ID]);

        expect(error).toBeNull();
        expect(data?.shared).toBe(1);
        expect(data?.failed).toBe(0);
    });

    it("retorna error si no se pasa postId ni fragmentId", async () => {
        const { data, error } = await shareToChat({} as any, [CHAT_ID]);

        expect(data).toBeNull();
        expect(error).toMatch(/postId|fragmentId/i);
    });

    it("retorna error si chatIds está vacío", async () => {
        const { data, error } = await shareToChat({ postId: POST_ID }, []);

        expect(data).toBeNull();
        expect(error).toMatch(/al menos un chat/i);
    });

    it("retorna error si se superan MAX_SHARE_CHATS chats", async () => {
        const tooMany = Array.from({ length: MAX_SHARE_CHATS + 1 }, (_, i) =>
        `${i.toString(16).padStart(8, "0")}-0000-0000-0000-000000000000`
        );

        const { data, error } = await shareToChat({ postId: POST_ID }, tooMany);

        expect(data).toBeNull();
        expect(error).toMatch(/máximo/i);
    });

    it("cuenta correctamente shared y failed en resultados mixtos", async () => {
        const CHAT_ID_2 = "ffffffff-0000-0000-0000-000000000099";

        // Primer chat OK, segundo falla en assertMembership
        (assertMembership as jest.Mock)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("No eres miembro"));

        mockFrom.mockImplementation((table: string) => {
        if (table === "posts") {
            return {
            select: jest.fn().mockReturnThis(),
            eq:     jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
                data: { description: "Post" }, error: null,
            }),
            };
        }
        return { insert: jest.fn().mockResolvedValue({ error: null }) };
        });

        const { data } = await shareToChat({ postId: POST_ID }, [CHAT_ID, CHAT_ID_2]);

        expect(data?.shared).toBe(1);
        expect(data?.failed).toBe(1);
    });

    it("usa el preview de descripción del post con prefijo 📷", async () => {
        const insertFn = jest.fn().mockResolvedValue({ error: null });

        mockFrom.mockImplementation((table: string) => {
        if (table === "posts") {
            return {
            select: jest.fn().mockReturnThis(),
            eq:     jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
                data: { description: "Mi foto" }, error: null,
            }),
            };
        }
        return { insert: insertFn };
        });

        await shareToChat({ postId: POST_ID }, [CHAT_ID]);

        // El insert de messages debe tener el preview con 📷
        const calls = insertFn.mock.calls.map((c) => c[0]);
        const msgInsert = calls.find((c: any) => c?.content?.startsWith("📷"));
        expect(msgInsert).toBeDefined();
    });

    it("usa preview genérico si el post no tiene descripción", async () => {
        const insertFn = jest.fn().mockResolvedValue({ error: null });

        mockFrom.mockImplementation((table: string) => {
        if (table === "posts") {
            return {
            select: jest.fn().mockReturnThis(),
            eq:     jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
                data: { description: null }, error: null,
            }),
            };
        }
        return { insert: insertFn };
        });

        await shareToChat({ postId: POST_ID }, [CHAT_ID]);

        const calls = insertFn.mock.calls.map((c) => c[0]);
        const msgInsert = calls.find((c: any) => c?.content === "📷 Publicación compartida");
        expect(msgInsert).toBeDefined();
    });

    it("usa el preview de contenido del fragment con prefijo 📝", async () => {
        const insertFn = jest.fn().mockResolvedValue({ error: null });

        mockFrom.mockImplementation((table: string) => {
        if (table === "fragments") {
            return {
            select: jest.fn().mockReturnThis(),
            eq:     jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
                data: { content: "Mi texto" }, error: null,
            }),
            };
        }
        return { insert: insertFn };
        });

        await shareToChat({ fragmentId: FRAG_ID }, [CHAT_ID]);

        const calls = insertFn.mock.calls.map((c) => c[0]);
        const msgInsert = calls.find((c: any) => c?.content?.startsWith("📝"));
        expect(msgInsert).toBeDefined();
    });

    it("usa preview genérico si el fragment no tiene contenido", async () => {
        const insertFn = jest.fn().mockResolvedValue({ error: null });

        mockFrom.mockImplementation((table: string) => {
        if (table === "fragments") {
            return {
            select: jest.fn().mockReturnThis(),
            eq:     jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
                data: { content: null }, error: null,
            }),
            };
        }
        return { insert: insertFn };
        });

        await shareToChat({ fragmentId: FRAG_ID }, [CHAT_ID]);

        const calls = insertFn.mock.calls.map((c) => c[0]);
        const msgInsert = calls.find((c: any) => c?.content === "📝 Fragment compartido");
        expect(msgInsert).toBeDefined();
    });

    it("verifica membresía para cada chat antes de insertar", async () => {
        const CHAT_ID_2 = "ffffffff-0000-0000-0000-000000000099";
        setupShareInserts();

        await shareToChat({ postId: POST_ID }, [CHAT_ID, CHAT_ID_2]);

        expect(assertMembership).toHaveBeenCalledWith(CHAT_ID, ME);
        expect(assertMembership).toHaveBeenCalledWith(CHAT_ID_2, ME);
    });

    it("valida los UUIDs de todos los chatIds", async () => {
        setupShareInserts();

        await shareToChat({ postId: POST_ID }, [CHAT_ID]);

        expect(assertUUIDs).toHaveBeenCalledWith([CHAT_ID], "chatId");
    });
});

// getTotalUnreadMessages
describe("getTotalUnreadMessages", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (getAuthUser as jest.Mock).mockResolvedValue(ME);
        (parseError as jest.Mock).mockImplementation((err: any) => err?.message ?? String(err));
    });

    it("retorna el total de mensajes no leídos correctamente", async () => {
        mockRpc.mockResolvedValueOnce({ data: 7, error: null });

        const { data, error } = await getTotalUnreadMessages();

        expect(error).toBeNull();
        expect(data).toBe(7);
    });

    it("retorna 0 si la RPC devuelve null", async () => {
        mockRpc.mockResolvedValueOnce({ data: null, error: null });

        const { data, error } = await getTotalUnreadMessages();

        expect(error).toBeNull();
        expect(data).toBe(0);
    });

    it("retorna 0 si la RPC devuelve 0", async () => {
        mockRpc.mockResolvedValueOnce({ data: 0, error: null });

        const { data } = await getTotalUnreadMessages();

        expect(data).toBe(0);
    });

    it("convierte el resultado a número aunque llegue como string", async () => {
        mockRpc.mockResolvedValueOnce({ data: "12" as any, error: null });

        const { data } = await getTotalUnreadMessages();

        expect(typeof data).toBe("number");
        expect(data).toBe(12);
    });

    it("llama a la RPC con el p_user_id del usuario autenticado", async () => {
        mockRpc.mockResolvedValueOnce({ data: 0, error: null });

        await getTotalUnreadMessages();

        expect(mockRpc).toHaveBeenCalledWith("get_total_unread_messages", {
        p_user_id: ME,
        });
    });

    it("retorna error si la RPC falla", async () => {
        mockRpc.mockResolvedValueOnce({ data: null, error: new Error("RPC error") });

        const { data, error } = await getTotalUnreadMessages();

        expect(data).toBeNull();
        expect(error).toBeTruthy();
    });

    it("retorna error si getAuthUser falla (sesión expirada)", async () => {
        (getAuthUser as jest.Mock).mockRejectedValueOnce(new Error("Sesión expirada"));

        const { data, error } = await getTotalUnreadMessages();

        expect(data).toBeNull();
        expect(error).toMatch(/sesión/i);
    });
});