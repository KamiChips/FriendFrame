import { supabase } from "@/__mocks__/supabaseMock";
import {
  sendMessage,
  getMessages,
  shareToChat,
  getTotalUnreadMessages,
} from "@/services/supabase/chat/chat.messages"

// Mocks
const mockSingle = jest.fn();
const mockMaybeSingle = jest.fn();
const mockRange = jest.fn();
const mockOrder = jest.fn(() => ({ range: mockRange }));
const mockEq = jest.fn();
const mockSelect = jest.fn();
const mockInsert = jest.fn();
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
    assertMembership: jest.fn(),
    assertUUIDs: jest.fn(),
    markMessagesAsRead: jest.fn(),
    normalizePagination: jest.fn(() => ({ from: 0, to: 19})),
    notifyMembers: jest.fn(),
    parseError: jest.fn((err: any) => err?.message ?? String(err)),
}));

import { getAuthUser, assertUUID } from "@/services/supabase/helpers/validation";
import {
  assertMembership,
  assertUUIDs,
  markMessagesAsRead,
  normalizePagination,
  notifyMembers,
  parseError,
} from "@/services/supabase/chat/chat.helpers";

// Constantes
const CURRENT_USER = "550e8400-e29b-41d4-a716-446655440000";
const CHAT_ID      = "6ba7b810-9dad-41d4-80b4-00c04fd430c8";
const POST_ID      = "6ba7b811-9dad-41d4-80b4-00c04fd430c8";
const FRAGMENT_ID  = "6ba7b812-9dad-41d4-80b4-00c04fd430c8";
const CHAT_ID_2    = "6ba7b813-9dad-41d4-80b4-00c04fd430c8";

const mockMessage = {
    message_id: "msg-1",
    chat_id: CHAT_ID,
    sender_id: CURRENT_USER,
    content: "Hola",
    is_read: false,
    create_at: "2026-01-01-01T00:00:00Z",
    sender: {
        user_id: CURRENT_USER,
        username: "maydev",
        full_name: "May",
        profile_pic: null
    },
};

beforeEach (() => {
    jest.clearAllMocks();
    (getAuthUser as jest.Mock).mockResolvedValue(CURRENT_USER);
    (parseError as jest.Mock).mockImplementation((err: any) => err?.message ?? String(err));
});

// sendMessage
describe( "sendMessage", () => {
    const setupInsertChain = (data: any, error: any = null) => {
        mockSingle.mockResolvedValueOnce({ data, error });
        const mockSelectFn = jest.fn().mockReturnValue({ single: mockSingle });
        const mockInsertFn = jest.fn().mockReturnValue({ select: mockSelectFn });
        mockFrom.mockReturnValue({ insert: mockInsertFn });
        return mockInsertFn;
    };

    it("envio un mensaje correctamente", async () => {
        const mockInsertFn = setupInsertChain(mockMessage);
        
        const result = await sendMessage(CHAT_ID, "Hola");

        expect(result.error).toBeNull();
        expect(result.data?.content).toBe("Hola");
        expect(result.data?.shared_post).toBeNull();
        expect(assertMembership).toHaveBeenCalledWith(CHAT_ID, CURRENT_USER);
        expect(notifyMembers).toHaveBeenCalledWith(CHAT_ID, CURRENT_USER, "msg-1");
        expect(mockInsertFn).toHaveBeenCalledWith(
            expect.objectContaining({ content: "Hola", chat_id: CHAT_ID }),
        );
    });

    it("trimea el contenido antes de enviar", async () => {
        const mockInsertFn = setupInsertChain({ ...mockMessage, content: "Hola" });

        await sendMessage(CHAT_ID, "  Hola  ");

        expect(mockInsertFn).toHaveBeenCalledWith(
            expect.objectContaining({ content: "Hola" }),
        );
    });

    it("devuelve error si el mensaje está vacio", async () => {
        const result = await sendMessage(CHAT_ID, "   ");
        expect(result.data).toBeNull();
        expect(result.data).toBeNull();
        expect(result.error).toMatch(/vacío/i);
    });

    it("devuelve error si Supabase falla al insertar", async () => {
        setupInsertChain(null, new Error("Insert failed"));
        const result = await sendMessage(CHAT_ID, "Hola");
        expect(result.data).toBeNull();
        expect(result.error).toBe("Insert failed");
    });

    it("llama a assertUUID con el chatId", async () => {
        setupInsertChain(mockMessage);
        await sendMessage(CHAT_ID, "Hola");
        expect(assertUUID).toHaveBeenCalledWith(CHAT_ID, "chatId");
    });
})

// getMessages
describe("getMessages", () => {
    const setupMessagesQuery = (data: any[], error: any = null) => {
        mockRange.mockResolvedValueOnce({ data, error });
        mockOrder.mockReturnValue({ range: mockRange });
        const mockEqFn = jest.fn().mockReturnValue({ order: mockOrder });
        const mockSelectFn = jest.fn().mockReturnValue({ eq: mockEqFn });
        mockFrom.mockReturnValue({ select: mockSelectFn });
    };

    it("devuelve mensajes correctamente", async() => {
        setupMessagesQuery([mockMessage]);

        const result = await getMessages(CHAT_ID);

        expect(result.error).toBeNull();
        expect(result.data).toHaveLength(1);
        expect(result.data![0].content).toBe("Hola");
        expect(result.data![0].shared_post).toBeNull();
        expect(result.data![0].shared_fragment).toBeNull();
    });

    it("llama a markMessagesAsRead después de obtener mesnajes", async () => {
        setupMessagesQuery([mockMessage]);
        const result = await getMessages(CHAT_ID);
        expect(markMessagesAsRead).toHaveBeenCalledWith(CHAT_ID, CURRENT_USER);
    });

    it("devuelve array vacío si no hay mensajes", async () => {
        setupMessagesQuery([]);
        const result = await getMessages(CHAT_ID);
        expect(result.data).toEqual([]);
        expect(result.error).toBeNull();
    });

    it("usa normalizePagination con los params correctos", async () => {
        setupMessagesQuery([]);
        await getMessages(CHAT_ID, { page: 2, limit: 10 });
        expect(normalizePagination).toHaveBeenCalledWith(2, 10);
    });

    it("devuelve error si Supabase falla", async () => {
        setupMessagesQuery([], new Error("Query failed"));
        const result = await getMessages(CHAT_ID);
        expect(result.data).toBeNull();
        expect(result.error).toBe("Query failed");
    });
});

// shareToChat
describe("shareToChat", () => {
    const setupPostQuery = (description: string | null) => {
        mockMaybeSingle.mockResolvedValueOnce({
            data: description ? { description } : null,
            error: null,
        });

        const mockEqFn = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
        const mockSelectFn = jest.fn().mockReturnValue({ eq: mockEqFn });
        return mockSelectFn;
    };

    const setupFragmentQuery = (content: string | null) => {
        mockMaybeSingle.mockResolvedValueOnce({
            date: content ? { content } : null,
            error: null,
        });

        const mockEqFn = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
        const mockSelectFn = jest.fn().mockReturnValue({ eq: mockEqFn });
        return mockSelectFn;
    };

    it("devuelve error si no se pasa postId ni fragmentId", async () => {
        const result = await shareToChat({ postId: undefined as any, fragmentId: undefined as any }, [CHAT_ID])
        expect(result.data).toBeNull();
        expect(result.error).toMatch(/postId o fragmentId/i)
    });

    it("devuelve error si chatIds está vacío", async () => {
        const result = await shareToChat({ postId: POST_ID}, []);
        expect(result.data).toBeNull();
        expect(result.error).toMatch(/al menos un chat/i);
    });

    it("devuelve error si supera el máximo de chats", async () => {
        const manyChats = Array(11).fill(CHAT_ID);
        const result = await shareToChat({ postId: POST_ID }, manyChats);

        expect(result.data).toBeNull();
        expect(result.error).toMatch(/máximo/i);
    });

    it("comparte un post correctamente", async () => {
        const mockSelectPost = setupPostQuery("Descripción del post");
        const mockInsertFn = jest.fn().mockResolvedValue({ error: null });

        mockFrom.mockImplementation((table: string) => {
            if (table === "posts") return { select: mockSelectPost };
            if (table === "shares") return { insert: mockInsertFn };
            if (table === "messages") return { insert: mockInsertFn };
        });

        const result = await shareToChat({ postId: POST_ID }, [CHAT_ID]);

        expect(result.error).toBeNull();
        expect(result.data?.shared).toBe(1);
        expect(result.data?.failed).toBe(0);
    });

    it("comparte un fragment correctamente", async () => {
        const mockSelectFragment = setupFragmentQuery("Contenido del fragment");
        const mockInsertFn = jest.fn().mockResolvedValue({ error: null });

        mockFrom.mockImplementation((table: string) => {
            if (table === "fragments") return { select: mockSelectFragment};
            if (table === "shares") return { insert: mockInsertFn };
            if (table === "messages") return { insert: mockInsertFn };
        });

        const result = await shareToChat({ fragmentId: FRAGMENT_ID }, [CHAT_ID]);

        expect(result.error).toBeNull();
        expect(result.data?.shared).toBe(1);
        expect(result.data?.failed).toBe(0);
    });

    it("cuenta correctamente shared y failed con múltiples chats", async () => {
        const mockSelectPost = setupPostQuery("Post");
        const mockInsertFn = jest.fn().mockResolvedValue({ error: null });

        // assertMembership falla en el segundo chat
        (assertMembership as jest.Mock)
        .mockResolvedValue(undefined)
        .mockRejectedValueOnce(new Error("No eres miembro"));
        
        mockFrom.mockImplementation((table: string) => {
            if (table === "posts") return { select: mockSelectPost };
            if (table === "shares") return { insert: mockInsertFn };
            if (table === "messages") return { insert: mockInsertFn };
        });

        const result = await shareToChat({ postId: POST_ID }, [CHAT_ID,  CHAT_ID_2]);

        expect(result.data?.shared).toBe(1);
        expect(result.data?.failed).toBe(1);
    });

    it("usa texto genérico si el post no tiene descripción", async () => {
        const mockSelectPost = setupPostQuery(null);
        const mockInsertFn = jest.fn().mockResolvedValue({ error: null });

        mockFrom.mockImplementation((table: string) => {
            if (table === "posts") return { select: mockSelectPost };
            if (table === "shares") return { insert: mockInsertFn };
            if (table === "messages") return { insert: mockInsertFn };
        });

        await shareToChat({ postId: POST_ID }, [CHAT_ID]);

        const messageInsertCall = mockInsertFn.mock.calls.find((call) => 
            call[0]?.content?.includes("📷"),
        );
        expect(messageInsertCall![0].content).toBe("📷 Publicación compartida");
    });
});

// getTotalUnreadMessages
describe("getTotalUnreadMessages", () => {
    it("devuelve el total de mensajes no leídos", async () => {
        mockRpc.mockResolvedValueOnce({ data: 5, error: null });
        const result = await getTotalUnreadMessages();
        expect(result.data).toBe(5);
        expect(result.error).toBeNull();
        expect(mockRpc).toHaveBeenCalledWith("get_total_unread_messages", {
            p_user_id: CURRENT_USER,
        });
    });

    it("devuelve 0 si el RPC devuelve null", async () => {
        mockRpc.mockResolvedValueOnce({ data: null, error: null });
        const result = await getTotalUnreadMessages();
        expect(result.data).toBe(0);
    });

    it("delvuelve error si el RPC falla", async () => {
        mockRpc.mockResolvedValueOnce({ data: null, error: new Error("RPC error")})
        const result = await getTotalUnreadMessages();
        expect(result.data).toBeNull();
        expect(result.error).toBe("RPC error");
    });
});