import { NOTIFICATION_SELECT } from "@/services/supabase/notifications/notification.helpers";
import { getUnreadCount } from "@/services/supabase/notifications/notification.queries";
import {
    subscribeToNotifications,
    subscribeToUnreadCount,
} from "@/services/supabase/notifications/notification.realtime";
import { subscribe } from "expo-router/build/link/linking";

// Mocks
const mockSingle = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn();
const mockFrom = jest.fn();
const mockSubscribe = jest.fn();
const mockOn = jest.fn();
const mockChannel = jest.fn();
const mockRemoveChannel = jest.fn();
const mockGetUser = jest.fn();
const mockGetUnreadCount =  jest.fn();

jest.mock("@/lib/supabase/client", () => ({
    supabase: {
        from: (...args: any[]) => mockFrom(...args),
        channel: (...args: any[]) => mockChannel(...args),
        removeChannel: (...args: any[]) => mockRemoveChannel(...args),
        auth: { getUser: () => mockGetUser() },
    },
}));

jest.mock("@/services/supabase/notifications/notification.helpers", () => ({
    NOTIFICATION_SELECT: "notification_id, type, is_read",
}));

jest.mock("@/services/supabase/notifications/notification.queries", () => ({
    getUnreadCount: (...args: any[]) => mockGetUnreadCount(...args),
}));

// Constantes
const USER_ID         = "550e8400-e29b-41d4-a716-446655440000";
const NOTIFICATION_ID = "6ba7b810-9dad-41d4-80b4-00c04fd430c8";

const mockNotificationData = {
    notification_id: NOTIFICATION_ID,
    type: "new_follow",
    is_read: false,
};

const mockCounts = { total: 3, follows: 1, posts: 1, messages: 1 };

const flushPromises = () => new Promise((r) => setTimeout(r, 0));

let capturedPayloadCallback: ((payload: any) => void) | null = null;
beforeEach(() => {
    jest.clearAllMocks();
    capturedPayloadCallback = null;

    mockGetUser.mockReturnValue(
        Promise.resolve({ data: { user: {id: USER_ID } } }),
    );
    mockGetUnreadCount.mockReturnValue({ data: mockCounts, error: null });

    mockOn.mockImplementation((_event: any, _filter: any, cb: any) => {
        if (cb && !capturedPayloadCallback) capturedPayloadCallback = cb;
        return { on: mockOn, subscribe: mockSubscribe };
    });
    mockSubscribe.mockReturnValue({});
    mockChannel.mockReturnValue({ on: mockOn, subscribe: mockSubscribe});
});

// subscribeToNotifications
describe("subscribeToNotifications", () => {
    it("no crea canal si no hay usuario autenticado", async () => {
        mockGetUser.mockReturnValue(
            Promise.resolve({ data: { user: null } }),
        );

        subscribeToNotifications(jest.fn());
        await flushPromises();

        expect(mockChannel).not.toHaveBeenCalled();
    });

    it("crea el canal con el nombre correcto", async () => {
        subscribeToNotifications(jest.fn());
        await flushPromises();

        expect(mockChannel).toHaveBeenCalledWith(`notifications-${USER_ID}`);
    });

    it("se suscribe a INSERT en notifications ocn filtro correcto", async () => {
        subscribeToNotifications(jest.fn());
        await flushPromises();

        expect(mockOn).toHaveBeenCalledWith(
            "postgres_changes",
            expect.objectContaining({
                event: "INSERT",
                table: "notifications",
                filter: `user_id=eq.${USER_ID}`,
            }),
            expect.any(Function),
        );
    });

    it("llama a onNew cuando llega una notificación", async () => {
        const onNew = jest.fn();

        const mockSingleFn = jest.fn().mockResolvedValueOnce({
            data: mockNotificationData,
            error: null,
        });

        const mockEqFn = jest.fn().mockReturnValue({ single: mockSingleFn });
        const mockSelectFn = jest.fn().mockReturnValue({ eq: mockEqFn });
        mockFrom.mockReturnValue({ select: mockSelectFn });

        subscribeToNotifications(onNew);
        await flushPromises();

        await capturedPayloadCallback!({ new: { notification_id: NOTIFICATION_ID } });

        expect(onNew).toHaveBeenCalledWith(mockNotificationData);
    });

    it("no llama a onNew si hay error en la query", async () => {
        const onNew = jest.fn();

        const mockSingleFn = jest.fn().mockResolvedValueOnce({
        data: null,
        error: new Error("Query failed"),
        });
        const mockEqFn = jest.fn().mockReturnValue({ single: mockSingleFn });
        const mockSelectFn = jest.fn().mockReturnValue({ eq: mockEqFn });
        mockFrom.mockReturnValue({ select: mockSelectFn });

        subscribeToNotifications(onNew);
        await flushPromises();

        await capturedPayloadCallback!({ new: { notification_id: NOTIFICATION_ID } });

        expect(onNew).not.toHaveBeenCalled();
    });

    it("llama a onCountChange si se provee y hay nueva notificación", async () => {
        const onNew = jest.fn();
        const onCountChange = jest.fn();

        const mockSingleFn = jest.fn().mockResolvedValueOnce({
        data: mockNotificationData,
        error: null,
        });
        const mockEqFn = jest.fn().mockReturnValue({ single: mockSingleFn });
        const mockSelectFn = jest.fn().mockReturnValue({ eq: mockEqFn });
        mockFrom.mockReturnValue({ select: mockSelectFn });

        subscribeToNotifications(onNew, onCountChange);
        await flushPromises();

        await capturedPayloadCallback!({ new: { notification_id: NOTIFICATION_ID } });

        expect(mockGetUnreadCount).toHaveBeenCalled();
        expect(onCountChange).toHaveBeenCalledWith(mockCounts);
    });

    it("no llama a onCountChange si no se provee", async () => {
        const mockSingleFn = jest.fn().mockResolvedValueOnce({
        data: mockNotificationData,
        error: null,
        });
        const mockEqFn = jest.fn().mockReturnValue({ single: mockSingleFn });
        const mockSelectFn = jest.fn().mockReturnValue({ eq: mockEqFn });
        mockFrom.mockReturnValue({ select: mockSelectFn });

        subscribeToNotifications(jest.fn()); // sin onCountChange
        await flushPromises();

        await capturedPayloadCallback!({ new: { notification_id: NOTIFICATION_ID } });

        expect(mockGetUnreadCount).not.toHaveBeenCalled();
    });

    it("devuelve función de cleanup que llama a removeChannel", async () => {
        const unsub = subscribeToNotifications(jest.fn());
        await flushPromises();

        unsub();
        expect(mockRemoveChannel).toHaveBeenCalledTimes(1);
    });

    it("cleanup no lanza error si el canal es null", () => {
        mockGetUser.mockReturnValue(
        Promise.resolve({ data: { user: null } }),
        );
        const unsub = subscribeToNotifications(jest.fn());
        expect(() => unsub()).not.toThrow();
    });
});

// subscribeToUnreadCound
describe("subscribeToUnreadCount", () => {
    it("no crea canal si no hay usuario autenticado", async () => {
        mockGetUser.mockReturnValue(
        Promise.resolve({ data: { user: null } }),
        );

        subscribeToUnreadCount(jest.fn());
        await flushPromises();

        expect(mockChannel).not.toHaveBeenCalled();
    });

    it("crea el canal con el nombre correcto", async () => {
        subscribeToUnreadCount(jest.fn());
        await flushPromises();

        expect(mockChannel).toHaveBeenCalledWith(`notification-count-${USER_ID}`);
    });

    it("se suscribe a INSERT y UPDATE en notifications", async () => {
        subscribeToUnreadCount(jest.fn());
        await flushPromises();

        const events = mockOn.mock.calls.map((c: any[]) => c[1]?.event);
        expect(events).toContain("INSERT");
        expect(events).toContain("UPDATE");
    });

    it("llama a onCountChange con el conteo inicial al suscribirse", async () => {
        const onCountChange = jest.fn();

        subscribeToUnreadCount(onCountChange);
        await flushPromises();

        expect(onCountChange).toHaveBeenCalledWith(mockCounts);
    });

    it("llama a onCountChange cuando llega un evento INSERT", async () => {
        const onCountChange = jest.fn();
        let insertCallback: (() => void) | null = null;

        mockOn.mockImplementation((_event: any, filter: any, cb: any) => {
        if (filter?.event === "INSERT" && !insertCallback) insertCallback = cb;
        return { on: mockOn, subscribe: mockSubscribe };
        });

        subscribeToUnreadCount(onCountChange);
        await flushPromises();

        onCountChange.mockClear(); // limpiamos la llamada inicial
        await insertCallback!();

        expect(onCountChange).toHaveBeenCalledWith(mockCounts);
    });

    it("llama a onCountChange cuando llega un evento UPDATE", async () => {
        const onCountChange = jest.fn();
        let updateCallback: (() => void) | null = null;

        mockOn.mockImplementation((_event: any, filter: any, cb: any) => {
        if (filter?.event === "UPDATE") updateCallback = cb;
        return { on: mockOn, subscribe: mockSubscribe };
        });

        subscribeToUnreadCount(onCountChange);
        await flushPromises();

        onCountChange.mockClear();
        await updateCallback!();

        expect(onCountChange).toHaveBeenCalledWith(mockCounts);
    });

    it("devuelve función de cleanup que llama a removeChannel", async () => {
        const unsub = subscribeToUnreadCount(jest.fn());
        await flushPromises();

        unsub();
        expect(mockRemoveChannel).toHaveBeenCalledTimes(1);
    });

    it("cleanup no lanza error si el canal es null", () => {
        mockGetUser.mockReturnValue(
        Promise.resolve({ data: { user: null } }),
        );
        const unsub = subscribeToUnreadCount(jest.fn());
        expect(() => unsub()).not.toThrow();
    });
});