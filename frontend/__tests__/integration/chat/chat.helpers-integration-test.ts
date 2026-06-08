const mockFrom = jest.fn();
const mockRpc  = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
    rpc:  (...args: any[]) => mockRpc(...args),
  },
}));

jest.mock("@/services/supabase/helpers/validation", () => ({
  UUID_REGEX: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
}));

// Imports post-mock
import {
  parseError,
  normalizePagination,
  assertUUIDs,
  assertFriendship,
  assertMembership,
  findExistingDirectChat,
  getChatById,
  notifyMembers,
  markMessagesAsRead,
} from "@/services/supabase/chat/chat.helpers";
import { DEFAULT_MSG_LIMIT, MAX_PAGE_LIMIT } from "@/services/supabase/chat/chat.types";

// Constantes 
const USER_A  = "aaaaaaaa-0000-0000-0000-000000000001";
const USER_B  = "bbbbbbbb-0000-0000-0000-000000000002";
const CHAT_ID = "cccccccc-0000-0000-0000-000000000003";
const MSG_ID  = "dddddddd-0000-0000-0000-000000000004";

// parseError
describe("parseError", () => {
    it("retorna 'Error desconocido' si err es falsy", () => {
        expect(parseError(null)).toBe("Error desconocido");
        expect(parseError(undefined)).toBe("Error desconocido");
        expect(parseError("")).toBe("Error desconocido");
    });

    it("traduce errores de row-level security", () => {
        expect(parseError(new Error("row-level security policy"))).toBe(
        "No tienes permiso para acceder a este chat."
        );
    });

    it("traduce errores de duplicate key", () => {
        expect(parseError(new Error("duplicate key value"))).toBe(
        "Ya eres miembro de este chat."
        );
    });

    it("traduce errores de foreign key", () => {
        expect(parseError(new Error("violates foreign key constraint"))).toBe(
        "El usuario o chat no existe."
        );
    });

    it("traduce NetworkError", () => {
        expect(parseError(new Error("NetworkError when attempting to fetch"))).toBe(
        "Error de red. Verifica tu conexión."
        );
    });

    it("traduce Failed to fetch", () => {
        expect(parseError(new Error("Failed to fetch"))).toBe(
        "Error de red. Verifica tu conexión."
        );
    });

    it("pasa directo mensajes propios del dominio (Solo puedes...)", () => {
        const msg = "Solo puedes iniciar chats con tus amigos.";
        expect(parseError(new Error(msg))).toBe(msg);
    });

    it("pasa directo mensajes con 'inválido'", () => {
        const msg = "UUID inválido.";
        expect(parseError(new Error(msg))).toBe(msg);
    });

    it("retorna mensaje genérico para errores desconocidos", () => {
        expect(parseError(new Error("algo raro que no está mapeado"))).toBe(
        "Ocurrió un error inesperado."
        );
    });

    it("funciona con strings en lugar de objetos Error", () => {
        // (err as Error).message es undefined para strings → String(err) como fallback
        const result = parseError("Solo puedes hacer esto");
        expect(result).toBe("Solo puedes hacer esto");
    });
});

// normalizePagination
describe("normalizePagination", () => {
    it("usa DEFAULT_MSG_LIMIT y página 0 cuando no se pasan args", () => {
        const { from, to } = normalizePagination();
        expect(from).toBe(0);
        expect(to).toBe(DEFAULT_MSG_LIMIT - 1);
    });

    it("calcula correctamente el rango para página 1", () => {
        const { from, to } = normalizePagination(1, 20);
        expect(from).toBe(20);
        expect(to).toBe(39);
    });

    it("calcula correctamente el rango para página 2", () => {
        const { from, to } = normalizePagination(2, 10);
        expect(from).toBe(20);
        expect(to).toBe(29);
    });

    it("clampea el limit a MAX_PAGE_LIMIT si se pasa uno mayor", () => {
        const { from, to } = normalizePagination(0, MAX_PAGE_LIMIT + 999);
        expect(to - from + 1).toBe(MAX_PAGE_LIMIT);
    });

    it("clampea el limit a 1 como mínimo", () => {
        const { from, to } = normalizePagination(0, 0);
        expect(to - from + 1).toBe(1);
    });

    it("clampea la página a 0 si se pasa un valor negativo", () => {
        const { from, to } = normalizePagination(-5, 10);
        expect(from).toBe(0);
        expect(to).toBe(9);
    });

    it("trunca decimales en page y limit", () => {
        const { from, to } = normalizePagination(1.9, 10.7);
        // Math.floor(1.9)=1, Math.floor(10.7)=10 → from=10, to=19
        expect(from).toBe(10);
        expect(to).toBe(19);
    });
});

// assertFriendship
describe("assertFriendship", () => {
    beforeEach(() => jest.clearAllMocks());

    it("resuelve sin error si la RPC devuelve true", async () => {
        mockRpc.mockResolvedValueOnce({ data: true, error: null });

        await expect(assertFriendship(USER_A, USER_B)).resolves.toBeUndefined();
    });

    it("lanza error si la RPC devuelve false (no son amigos)", async () => {
        mockRpc.mockResolvedValueOnce({ data: false, error: null });

        await expect(assertFriendship(USER_A, USER_B)).rejects.toThrow(/amigos/i);
    });

    it("lanza error si la RPC devuelve null", async () => {
        mockRpc.mockResolvedValueOnce({ data: null, error: null });

        await expect(assertFriendship(USER_A, USER_B)).rejects.toThrow(/amigos/i);
    });

    it("lanza el error de Supabase si la RPC falla", async () => {
        const rpcError = new Error("RPC error");
        mockRpc.mockResolvedValueOnce({ data: null, error: rpcError });

        await expect(assertFriendship(USER_A, USER_B)).rejects.toThrow("RPC error");
    });

    it("llama a la RPC con los parámetros correctos", async () => {
        mockRpc.mockResolvedValueOnce({ data: true, error: null });

        await assertFriendship(USER_A, USER_B);

        expect(mockRpc).toHaveBeenCalledWith("assert_friendship_rpc", {
        user_a: USER_A,
        user_b: USER_B,
        });
    });
});

// assertMembership
describe("assertMembership", () => {
    function setupMembershipQuery(data: object | null) {
        const maybeSingleFn = jest.fn().mockResolvedValueOnce({ data });
        const eq2Fn         = jest.fn().mockReturnValue({ maybeSingle: maybeSingleFn });
        const eq1Fn         = jest.fn().mockReturnValue({ eq: eq2Fn });
        const selectFn      = jest.fn().mockReturnValue({ eq: eq1Fn });
        mockFrom.mockReturnValue({ select: selectFn });
        return { selectFn, eq1Fn, eq2Fn, maybeSingleFn };
    }

    beforeEach(() => jest.clearAllMocks());

    it("resuelve sin error si el usuario es miembro", async () => {
        setupMembershipQuery({ chat_members_id: "some-id" });

        await expect(assertMembership(CHAT_ID, USER_A)).resolves.toBeUndefined();
    });

    it("lanza error si el usuario no es miembro (data null)", async () => {
        setupMembershipQuery(null);

        await expect(assertMembership(CHAT_ID, USER_A)).rejects.toThrow(/miembro/i);
    });

    it("filtra por chat_id y user_id correctos", async () => {
        const { eq1Fn, eq2Fn } = setupMembershipQuery({ chat_members_id: "x" });

        await assertMembership(CHAT_ID, USER_A);

        expect(eq1Fn).toHaveBeenCalledWith("chat_id", CHAT_ID);
        expect(eq2Fn).toHaveBeenCalledWith("user_id", USER_A);
    });
});

// findExistingDirectChat
describe("findExistingDirectChat", () => {
    beforeEach(() => jest.clearAllMocks());

    it("retorna el chat_id si la RPC encuentra un chat existente", async () => {
        mockRpc.mockResolvedValueOnce({ data: CHAT_ID, error: null });

        const result = await findExistingDirectChat(USER_A, USER_B);

        expect(result).toBe(CHAT_ID);
    });

    it("retorna null si la RPC no encuentra chat (data null)", async () => {
        mockRpc.mockResolvedValueOnce({ data: null, error: null });

        const result = await findExistingDirectChat(USER_A, USER_B);

        expect(result).toBeNull();
    });

    it("lanza el error de Supabase si la RPC falla", async () => {
        mockRpc.mockResolvedValueOnce({ data: null, error: new Error("RPC error") });

        await expect(findExistingDirectChat(USER_A, USER_B)).rejects.toThrow("RPC error");
    });

    it("llama a la RPC con user_a y user_b correctos", async () => {
        mockRpc.mockResolvedValueOnce({ data: null, error: null });

        await findExistingDirectChat(USER_A, USER_B);

        expect(mockRpc).toHaveBeenCalledWith("find_direct_chat", {
        user_a: USER_A,
        user_b: USER_B,
        });
    });
});

// getChatById
describe("getChatById", () => {
    const CHAT_ROW = {
        chat_id:    CHAT_ID,
        is_group:   false,
        group_name: null,
        created_by: USER_A,
        created_at: "2024-01-01T00:00:00Z",
        members: [
        { joined_at: "2024-01-01", user: { user_id: USER_A, full_name: "Yo", username: "yo", profile_pic: null } },
        { joined_at: "2024-01-01", user: { user_id: USER_B, full_name: "Amigo", username: "amigo", profile_pic: null } },
        ],
    };

    const LAST_MSG = {
        content:    "Hola!",
        sender_id:  USER_B,
        created_at: "2024-01-02T10:00:00Z",
        sender:     { username: "amigo" },
    };

    /** Configura la cadena .select().eq().single() para la tabla "chat" */
    function setupChatSelect(data: object | null, error: any = null) {
        const singleFn = jest.fn().mockResolvedValueOnce({ data, error });
        const eqFn     = jest.fn().mockReturnValue({ single: singleFn });
        const selectFn = jest.fn().mockReturnValue({ eq: eqFn });
        return selectFn;
    }

    /** Configura el mock de messages para last_message y unread_count */
    function setupMessagesFrom(lastMsg: object | null, unreadCount: number) {
        let callCount = 0;
        mockFrom.mockImplementation((table: string) => {
        if (table === "chat") {
            return { select: setupChatSelect(CHAT_ROW) };
        }
        // "messages" se llama 2 veces en Promise.all
        callCount++;
        if (callCount === 1) {
            // last message query
            return {
            select: jest.fn().mockReturnThis(),
            eq:     jest.fn().mockReturnThis(),
            order:  jest.fn().mockReturnThis(),
            limit:  jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValueOnce({ data: lastMsg }),
            };
        }
        // unread count query
        return {
            select: jest.fn().mockReturnThis(),
            eq:     jest.fn().mockReturnThis(),
            neq:    jest.fn().mockResolvedValueOnce({ count: unreadCount }),
        };
        });
    }

    beforeEach(() => jest.clearAllMocks());

    it("retorna null si Supabase falla al obtener el chat", async () => {
        mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValueOnce({ data: null, error: new Error("not found") }),
            }),
        }),
        });

        const result = await getChatById(CHAT_ID, USER_A);

        expect(result).toBeNull();
    });

    it("mapea correctamente los miembros del chat", async () => {
        setupMessagesFrom(null, 0);

        const result = await getChatById(CHAT_ID, USER_A);

        expect(result?.members).toHaveLength(2);
        expect(result?.members[0].username).toBe("yo");
        expect(result?.members[1].username).toBe("amigo");
        expect(result?.members[0].joined_at).toBe("2024-01-01");
    });

    it("mapea last_message correctamente cuando hay mensajes", async () => {
        setupMessagesFrom(LAST_MSG, 0);

        const result = await getChatById(CHAT_ID, USER_A);

        expect(result?.last_message).not.toBeNull();
        expect(result?.last_message?.content).toBe("Hola!");
        expect(result?.last_message?.sender_id).toBe(USER_B);
        expect(result?.last_message?.sender_username).toBe("amigo");
    });

    it("asigna last_message como null si no hay mensajes", async () => {
        setupMessagesFrom(null, 0);

        const result = await getChatById(CHAT_ID, USER_A);

        expect(result?.last_message).toBeNull();
    });

    it("asigna unread_count correctamente", async () => {
        setupMessagesFrom(null, 5);

        const result = await getChatById(CHAT_ID, USER_A);

        expect(result?.unread_count).toBe(5);
    });

    it("asigna unread_count 0 si count es null", async () => {
        let callCount = 0;
        mockFrom.mockImplementation((table: string) => {
        if (table === "chat") return { select: setupChatSelect(CHAT_ROW) };
        callCount++;
        if (callCount === 1) {
            return {
            select:      jest.fn().mockReturnThis(),
            eq:          jest.fn().mockReturnThis(),
            order:       jest.fn().mockReturnThis(),
            limit:       jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValueOnce({ data: null }),
            };
        }
        return {
            select: jest.fn().mockReturnThis(),
            eq:     jest.fn().mockReturnThis(),
            neq:    jest.fn().mockResolvedValueOnce({ count: null }),
        };
        });

        const result = await getChatById(CHAT_ID, USER_A);

        expect(result?.unread_count).toBe(0);
    });

    it("retorna los campos base del chat correctamente", async () => {
        setupMessagesFrom(null, 0);

        const result = await getChatById(CHAT_ID, USER_A);

        expect(result?.chat_id).toBe(CHAT_ID);
        expect(result?.is_group).toBe(false);
        expect(result?.created_by).toBe(USER_A);
    });
});

// markMessagesAsRead
describe("markMessagesAsRead", () => {
    function setupUpdateChain(error: any = null, count: number = 0) {
        const neqFn    = jest.fn().mockResolvedValueOnce({ error, count });
        const eq2Fn    = jest.fn().mockReturnValue({ neq: neqFn });
        const eq1Fn    = jest.fn().mockReturnValue({ eq: eq2Fn });
        const updateFn = jest.fn().mockReturnValue({ eq: eq1Fn });
        mockFrom.mockReturnValue({ update: updateFn });
        return { updateFn, eq1Fn, eq2Fn, neqFn };
    }

    beforeEach(() => jest.clearAllMocks());

    it("resuelve sin lanzar errores en flujo normal", async () => {
        setupUpdateChain(null, 3);

        await expect(markMessagesAsRead(CHAT_ID, USER_A)).resolves.toBeUndefined();
    });

    it("actualiza is_read=true en la tabla messages", async () => {
        const { updateFn } = setupUpdateChain(null, 0);

        await markMessagesAsRead(CHAT_ID, USER_A);

        expect(updateFn).toHaveBeenCalledWith(
        { is_read: true },
        { count: "exact" }
        );
    });

    it("filtra por chat_id correcto", async () => {
        const { eq1Fn } = setupUpdateChain(null, 0);

        await markMessagesAsRead(CHAT_ID, USER_A);

        expect(eq1Fn).toHaveBeenCalledWith("chat_id", CHAT_ID);
    });

    it("filtra por is_read=false para no tocar mensajes ya leídos", async () => {
        const { eq2Fn } = setupUpdateChain(null, 0);

        await markMessagesAsRead(CHAT_ID, USER_A);

        expect(eq2Fn).toHaveBeenCalledWith("is_read", false);
    });

    it("excluye los mensajes enviados por el propio usuario", async () => {
        const { neqFn } = setupUpdateChain(null, 0);

        await markMessagesAsRead(CHAT_ID, USER_A);

        expect(neqFn).toHaveBeenCalledWith("sender_id", USER_A);
    });

    it("no lanza aunque Supabase retorne error (fire-and-forget)", async () => {
        setupUpdateChain(new Error("Update failed"), 0);

        // markMessagesAsRead no hace throw del error, solo loguea
        await expect(markMessagesAsRead(CHAT_ID, USER_A)).resolves.toBeUndefined();
    });
});

// assertUUIDs  (líneas 11-12 del fuente — sin cobertura)
describe("assertUUIDs", () => {
    it("no lanza si todos los valores son UUIDs válidos", () => {
        expect(() => assertUUIDs([USER_A, USER_B])).not.toThrow();
    });

    it("lanza con el índice correcto si el primer UUID es inválido", () => {
        expect(() => assertUUIDs(["no-es-uuid", USER_B], "miembro")).toThrow(
        "miembro[0] inválido."
        );
    });

    it("lanza en el índice correcto cuando el inválido no es el primero", () => {
        expect(() => assertUUIDs([USER_A, "mal-formato"], "ID")).toThrow(
        "ID[1] inválido."
        );
    });

    it("usa 'ID' como label por defecto", () => {
        expect(() => assertUUIDs(["bad"])).toThrow("ID[0] inválido.");
    });

    it("no lanza con un array vacío", () => {
        expect(() => assertUUIDs([])).not.toThrow();
    });
});

const flushPromises = () => new Promise((r) => setImmediate(r));

describe("notifyMembers", () => {
    const SENDER_ID  = USER_A;
    const MEMBER_ID  = USER_B;
    const MEMBER_ID2 = "eeeeeeee-0000-0000-0000-000000000005";

    beforeEach(() => jest.clearAllMocks());

    it("no retorna nada (undefined) — es fire-and-forget", () => {
        mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq:     jest.fn().mockReturnThis(),
        neq:    jest.fn().mockResolvedValue({ data: [], error: null }),
        });

        const result = notifyMembers(CHAT_ID, SENDER_ID, MSG_ID);

        expect(result).toBeUndefined();
    });

    it("consulta chat_members filtrando por chat_id y excluyendo al sender", async () => {
        const neqFn = jest.fn().mockResolvedValue({ data: [], error: null });
        const eqFn  = jest.fn().mockReturnValue({ neq: neqFn });
        const selFn = jest.fn().mockReturnValue({ eq: eqFn });
        mockFrom.mockReturnValue({ select: selFn });

        notifyMembers(CHAT_ID, SENDER_ID, MSG_ID);
        await flushPromises();

        expect(selFn).toHaveBeenCalledWith("user_id");
        expect(eqFn).toHaveBeenCalledWith("chat_id", CHAT_ID);
        expect(neqFn).toHaveBeenCalledWith("user_id", SENDER_ID);
    });

    it("inserta una notificación por cada miembro con los campos correctos", async () => {
        const insertFn = jest.fn().mockResolvedValue({ error: null });

        mockFrom.mockImplementation((table: string) => {
        if (table === "chat_members") {
            return {
            select: jest.fn().mockReturnThis(),
            eq:     jest.fn().mockReturnThis(),
            neq:    jest.fn().mockResolvedValue({
                data: [{ user_id: MEMBER_ID }, { user_id: MEMBER_ID2 }],
                error: null,
            }),
            };
        }
        // tabla "notifications"
        return { insert: insertFn };
        });

        notifyMembers(CHAT_ID, SENDER_ID, MSG_ID);
        await flushPromises();

        expect(insertFn).toHaveBeenCalledWith([
        { user_id: MEMBER_ID,  type: "new_message", actor_id: SENDER_ID, message_id: MSG_ID },
        { user_id: MEMBER_ID2, type: "new_message", actor_id: SENDER_ID, message_id: MSG_ID },
        ]);
    });

    it("no inserta notificaciones si no hay otros miembros en el chat", async () => {
        const insertFn = jest.fn();

        mockFrom.mockImplementation((table: string) => {
        if (table === "chat_members") {
            return {
            select: jest.fn().mockReturnThis(),
            eq:     jest.fn().mockReturnThis(),
            neq:    jest.fn().mockResolvedValue({ data: [], error: null }),
            };
        }
        return { insert: insertFn };
        });

        notifyMembers(CHAT_ID, SENDER_ID, MSG_ID);
        await flushPromises();

        expect(insertFn).not.toHaveBeenCalled();
    });

    it("silencia el error si falla la query de miembros", async () => {
        mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq:     jest.fn().mockReturnThis(),
        neq:    jest.fn().mockRejectedValue(new Error("network error")),
        });

        notifyMembers(CHAT_ID, SENDER_ID, MSG_ID);

        await expect(flushPromises()).resolves.toBeUndefined();
    });

    it("silencia el error si falla el insert de notificaciones", async () => {
        mockFrom.mockImplementation((table: string) => {
        if (table === "chat_members") {
            return {
            select: jest.fn().mockReturnThis(),
            eq:     jest.fn().mockReturnThis(),
            neq:    jest.fn().mockResolvedValue({
                data: [{ user_id: MEMBER_ID }],
                error: null,
            }),
            };
        }
        return {
            insert: jest.fn().mockRejectedValue(new Error("insert failed")),
        };
        });

        notifyMembers(CHAT_ID, SENDER_ID, MSG_ID);

        await expect(flushPromises()).resolves.toBeUndefined();
    });
});