import {
  getNotificationText,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markMultipleAsRead,
  markAllAsRead,
  markTypeAsRead,
  deleteNotification,
} from "@/services/supabase/notifications/notification.queries";

import { getAuthUser, assertUUID } from "@/services/supabase/helpers/validation";
import { parseError } from "@/services/supabase/helpers/errors";
import {
  assertNotificationType,
  normalizePagination,
} from "@/services/supabase/notifications/notification.helpers";

// Mocks 

const mockSingle = jest.fn();
const mockRange = jest.fn();
const mockOrder = jest.fn();
const mockEq = jest.fn();
const mockNeq = jest.fn();
const mockIn = jest.fn();
const mockSelect = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
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

jest.mock("@/services/supabase/helpers/errors", () => ({
    parseError: jest.fn((err: any) => err?.message ?? String(err)),
}));

jest.mock("@/services/supabase/notifications/notification.helpers", () => ({
    assertNotificationType: jest.fn(),
    normalizePagination: jest.fn(() => ({ from: 0, to: 19 })),
    NOTIFICATION_SELECT: "notification_id, type, is_read",
}));

// Constantes 
const USER_ID         = "550e8400-e29b-41d4-a716-446655440000";
const NOTIFICATION_ID = "6ba7b810-9dad-41d4-80b4-00c04fd430c8";
const NOTIFICATION_ID_2 = "6ba7b811-9dad-41d4-80b4-00c04fd430c8";

beforeEach(() => {
    jest.clearAllMocks();
    (getAuthUser as jest.Mock).mockResolvedValue(USER_ID);
    (parseError as jest.Mock).mockImplementation((err: any) => err?.message ?? String(err));
});

// getNotificationText 
describe("getNotificationText", () => {
    const base = {
        notification_id: NOTIFICATION_ID,
        user_id: USER_ID,
        is_read: false,
        created_at: "2024-01-01T00:00:00Z",
        actor: { user_id: USER_ID, username: "maydev", full_name: "May", profile_pic: null },
        post: null,
        fragment: null,
        message: null,
    };

    it("devuelve texto correcto para new_follow", () => {
        const result = getNotificationText({ ...base, type: "new_follow" });
        expect(result.title).toBe("Nuevo seguidor");
        expect(result.body).toContain("May");
    });

    it("devuelve texto correcto para new_post", () => {
        const result = getNotificationText({ ...base, type: "new_post" });
        expect(result.title).toBe("Nueva publicación en tu perfil");
        expect(result.body).toContain("May");
    });

    it("devuelve texto correcto para new_fragment", () => {
        const result = getNotificationText({ ...base, type: "new_fragment" });
        expect(result.title).toBe("Nuevo fragment en tu perfil");
    });

    it("devuelve texto correcto para new_message con contenido", () => {
        const notification = {
        ...base,
        type: "new_message" as const,
        message: { message_id: "msg-1", content: "Hola!", chat_id: "chat-1" },
        };
        const result = getNotificationText(notification);
        expect(result.title).toBe("Nuevo mensaje");
        expect(result.body).toContain("Hola!");
    });

    it("trunca el contenido del mensaje a 60 caracteres", () => {
        const longContent = "a".repeat(100);
        const notification = {
        ...base,
        type: "new_message" as const,
        message: { message_id: "msg-1", content: longContent, chat_id: "chat-1" },
        };
        const result = getNotificationText(notification);
        expect(result.body.length).toBeLessThanOrEqual("May: ".length + 60);
    });

    it("usa username si no hay full_name", () => {
        const notification = {
        ...base,
        type: "new_follow" as const,
        actor: { user_id: USER_ID, username: "maydev", full_name: null as any, profile_pic: null },
        };
        const result = getNotificationText(notification);
        expect(result.body).toContain("maydev");
    });

    it("usa 'Alguien' si no hay actor", () => {
        const notification = { ...base, type: "new_follow" as const, actor: null as any };
        const result = getNotificationText(notification);
        expect(result.body).toContain("Alguien");
    });

    it("devuelve título genérico para tipo desconocido", () => {
        const result = getNotificationText({ ...base, type: "unknown" as any });
        expect(result.title).toBe("Notificación");
        expect(result.body).toBe("");
    });
});

// getNotifications 
describe("getNotifications", () => {
    const setupQuery = (data: any[], error: any = null) => {
        mockRange.mockResolvedValueOnce({ data, error });
        mockOrder.mockReturnValue({ range: mockRange });
        mockEq.mockReturnValue({ order: mockOrder, eq: mockEq, range: mockRange });
        mockSelect.mockReturnValue({ eq: mockEq });
        mockFrom.mockReturnValue({ select: mockSelect });
    };

    it("devuelve notificaciones correctamente", async () => {
        const mockData = [{ notification_id: NOTIFICATION_ID, type: "new_follow" }];
        setupQuery(mockData);

        const result = await getNotifications();

        expect(result.error).toBeNull();
        expect(result.data).toHaveLength(1);
    });

    it("filtra por unread_only cuando se indica", async () => {
        const mockEqIsRead = jest.fn().mockResolvedValueOnce({ data: [], error: null });
        const mockRangeFn = jest.fn().mockReturnValue({ eq: mockEqIsRead });
        const mockOrderFn = jest.fn().mockReturnValue({ range: mockRangeFn });
        const mockEqUserId = jest.fn().mockReturnValue({ order: mockOrderFn });
        const mockSelectFn = jest.fn().mockReturnValue({ eq: mockEqUserId });
        mockFrom.mockReturnValue({ select: mockSelectFn });

        await getNotifications({ unread_only: true });

        expect(mockEqIsRead).toHaveBeenCalledWith("is_read", false);
    });

    it("usa normalizePagination con los params correctos", async () => {
        setupQuery([]);

        await getNotifications({ page: 2, limit: 10 });

        expect(normalizePagination).toHaveBeenCalledWith(2, 10);
    });

    it("devuelve error si Supabase falla", async () => {
        setupQuery([], new Error("Query failed"));

        const result = await getNotifications();

        expect(result.data).toBeNull();
        expect(result.error).toBe("Query failed");
    });
});

// getUnreadCount 
describe("getUnreadCount", () => {
    const setupRpc = (data: any, error: any = null) => {
        mockSingle.mockResolvedValueOnce({ data, error });
        mockRpc.mockReturnValue({ single: mockSingle });
    };

    it("devuelve conteos correctamente", async () => {
        setupRpc({
        total_count: "5",
        follows_count: "2",
        posts_count: "1",
        messages_count: "2",
        });

        const result = await getUnreadCount();

        expect(result.error).toBeNull();
        expect(result.data).toEqual({
        total: 5,
        follows: 2,
        posts: 1,
        messages: 2,
        });
    });

    it("devuelve ceros si el RPC devuelve null", async () => {
        setupRpc(null);

        const result = await getUnreadCount();

        expect(result.data).toEqual({
        total: 0,
        follows: 0,
        posts: 0,
        messages: 0,
        });
    });

    it("devuelve error si el RPC falla", async () => {
        setupRpc(null, new Error("RPC error"));

        const result = await getUnreadCount();

        expect(result.data).toBeNull();
        expect(result.error).toBe("RPC error");
    });
});

// markAsRead 
describe("markAsRead", () => {
    const setupUpdate = (error: any = null) => {
        const mockFinalEq = jest.fn().mockResolvedValueOnce({ error });
        const mockFirstEq = jest.fn().mockReturnValue({ eq: mockFinalEq });
        const mockUpdateFn = jest.fn().mockReturnValue({ eq: mockFirstEq });
        mockFrom.mockReturnValue({ update: mockUpdateFn });
        return mockUpdateFn;
    };

    it("marca una notificación como leída correctamente", async () => {
        setupUpdate(null);

        const result = await markAsRead(NOTIFICATION_ID);

        expect(result.data).toBeNull();
        expect(result.error).toBeNull();
        expect(assertUUID).toHaveBeenCalledWith(NOTIFICATION_ID, "ID de notificación");
    });

    it("devuelve error si Supabase falla", async () => {
        setupUpdate(new Error("Update failed"));

        const result = await markAsRead(NOTIFICATION_ID);

        expect(result.data).toBeNull();
        expect(result.error).toBe("Update failed");
    });
});

// markMultipleAsRead 
describe("markMultipleAsRead", () => {
    const setupUpdate = (error: any = null) => {
        const mockEqFn = jest.fn().mockResolvedValueOnce({ error });
        const mockInFn = jest.fn().mockReturnValue({ eq: mockEqFn });
        const mockUpdateFn = jest.fn().mockReturnValue({ in: mockInFn });
        mockFrom.mockReturnValue({ update: mockUpdateFn });
    };

    it("devuelve éxito con array vacío sin hacer query", async () => {
        const result = await markMultipleAsRead([]);
        expect(result.data).toBeNull();
        expect(result.error).toBeNull();
        expect(mockFrom).not.toHaveBeenCalled();
    });

    it("devuelve error si supera el máximo de IDs", async () => {
        const manyIds = Array(101).fill(NOTIFICATION_ID);
        const result = await markMultipleAsRead(manyIds);
        expect(result.error).toMatch(/máximo/i);
    });

    it("marca múltiples notificaciones correctamente", async () => {
        setupUpdate(null);

        const result = await markMultipleAsRead([NOTIFICATION_ID, NOTIFICATION_ID_2]);

        expect(result.data).toBeNull();
        expect(result.error).toBeNull();
    });

    it("devuelve error si Supabase falla", async () => {
        setupUpdate(new Error("Batch failed"));

        const result = await markMultipleAsRead([NOTIFICATION_ID]);

        expect(result.data).toBeNull();
        expect(result.error).toBe("Batch failed");
    });
});

// markAllAsRead 
describe("markAllAsRead", () => {
    const setupUpdate = (data: any[], error: any = null) => {
        const mockSelectFn = jest.fn().mockResolvedValueOnce({ data, error });
        const mockEqFn2 = jest.fn().mockReturnValue({ select: mockSelectFn });
        const mockEqFn1 = jest.fn().mockReturnValue({ eq: mockEqFn2 });
        const mockUpdateFn = jest.fn().mockReturnValue({ eq: mockEqFn1 });
        mockFrom.mockReturnValue({ update: mockUpdateFn });
    };

    it("devuelve el número de notificaciones actualizadas", async () => {
        setupUpdate([{ notification_id: NOTIFICATION_ID }, { notification_id: NOTIFICATION_ID_2 }]);

        const result = await markAllAsRead();

        expect(result.error).toBeNull();
        expect(result.data?.updated).toBe(2);
    });

    it("devuelve 0 si no había notificaciones sin leer", async () => {
        setupUpdate([]);

        const result = await markAllAsRead();

        expect(result.data?.updated).toBe(0);
    });

    it("devuelve error si Supabase falla", async () => {
        setupUpdate([], new Error("Update failed"));

        const result = await markAllAsRead();

        expect(result.data).toBeNull();
        expect(result.error).toBe("Update failed");
    });
});

// markTypeAsRead 
describe("markTypeAsRead", () => {
    const setupUpdate = (error: any = null) => {
        const mockFinalEq = jest.fn().mockResolvedValueOnce({ error });
        const mockEq2 = jest.fn().mockReturnValue({ eq: mockFinalEq });
        const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
        const mockUpdateFn = jest.fn().mockReturnValue({ eq: mockEq1 });
        mockFrom.mockReturnValue({ update: mockUpdateFn });
    };

    it("marca todas las notificaciones de un tipo como leídas", async () => {
        setupUpdate(null);

        const result = await markTypeAsRead("new_follow");

        expect(result.data).toBeNull();
        expect(result.error).toBeNull();
        expect(assertNotificationType).toHaveBeenCalledWith("new_follow");
    });

    it("devuelve error si el tipo es inválido", async () => {
        (assertNotificationType as jest.Mock).mockImplementationOnce(() => {
        throw new Error("Tipo de notificación inválido: bad_type");
        });

        const result = await markTypeAsRead("bad_type" as any);

        expect(result.data).toBeNull();
        expect(result.error).toMatch(/inválido/i);
    });

    it("devuelve error si Supabase falla", async () => {
        setupUpdate(new Error("Update failed"));

        const result = await markTypeAsRead("new_post");

        expect(result.data).toBeNull();
        expect(result.error).toBe("Update failed");
    });
});

// deleteNotification 
describe("deleteNotification", () => {
    const setupDelete = (error: any = null) => {
        const mockFinalEq = jest.fn().mockResolvedValueOnce({ error });
        const mockFirstEq = jest.fn().mockReturnValue({ eq: mockFinalEq });
        const mockDeleteFn = jest.fn().mockReturnValue({ eq: mockFirstEq });
        mockFrom.mockReturnValue({ delete: mockDeleteFn });
    };

    it("elimina una notificación correctamente", async () => {
        setupDelete(null);

        const result = await deleteNotification(NOTIFICATION_ID);

        expect(result.data).toBeNull();
        expect(result.error).toBeNull();
        expect(assertUUID).toHaveBeenCalledWith(NOTIFICATION_ID, "ID de notificación");
    });

    it("devuelve error si Supabase falla", async () => {
        setupDelete(new Error("Delete failed"));

        const result = await deleteNotification(NOTIFICATION_ID);

        expect(result.data).toBeNull();
        expect(result.error).toBe("Delete failed");
    });
});