import {
    subscribeToMessages,
    subscribeToChatList,
} from "@/services/supabase/chat/chat.realtime";

// Mocks

const mockSubscribe = jest.fn();
const mockOn = jest.fn();
const mockChannel = jest.fn();
const mockRemoveChannel = jest.fn();
const mockGetChannels = jest.fn(() => [] as any[]);
const mockGetUser = jest.fn();

let capturedPayloadCallback: ((payload: any) => void) | null = null;

jest.mock("@/lib/supabase/client", () => ({
    supabase: {
        from: (...args: any[]) => mockFrom(...args),
        channel: (...args: any[]) => mockChannel(...args),
        removeChannel: (...args: any[]) => mockRemoveChannel(...args),
        getChannels: () => mockGetChannels(),
        auth: {
            // debe retornar una Promise real para que .then() funcione
            getUser: () => mockGetUser(),
        },
    },
}));

jest.mock("@/services/supabase/helpers/validation", () => ({
    UUID_REGEX: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
}));

// mockFrom se declara después
const mockFrom = jest.fn();

// Constantes

const CHAT_ID    = "550e8400-e29b-41d4-a716-446655440000";
const USER_ID    = "6ba7b810-9dad-41d4-80b4-00c04fd430c8";
const MESSAGE_ID = "6ba7b811-9dad-41d4-80b4-00c04fd430c8";

const mockMessageData = {
    message_id: MESSAGE_ID,
    chat_id: CHAT_ID,
    sender_id: USER_ID,
    content: "Hola",
    is_read: false,
    created_at: "2024-01-01T00:00:00Z",
    sender: {
        user_id: USER_ID,
        username: "maydev",
        full_name: "May",
        profile_pic: null,
    },
};

const flushPromises = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
    jest.clearAllMocks();
    capturedPayloadCallback = null;

    mockOn.mockImplementation((_event: any, _filter: any, cb: any) => {
        if (cb && !capturedPayloadCallback) capturedPayloadCallback = cb;
        return { on: mockOn, subscribe: mockSubscribe };
    });
    mockSubscribe.mockReturnValue({});
    mockChannel.mockReturnValue({ on: mockOn, subscribe: mockSubscribe });

    // getUser devuelve Promise real
    mockGetUser.mockReturnValue(
        Promise.resolve({ data: { user: { id: USER_ID } } }),
    );
    mockGetChannels.mockReturnValue([]);
});

// subscribeToMessages

describe("subscribeToMessages", () => {
    it("devuelve función vacía si el chatId no es UUID válido", () => {
        const unsub = subscribeToMessages("not-a-uuid", jest.fn());
        expect(typeof unsub).toBe("function");
        expect(mockChannel).not.toHaveBeenCalled();
        expect(() => unsub()).not.toThrow();
    });

    it("crea el canal con el nombre correcto", () => {
        subscribeToMessages(CHAT_ID, jest.fn());
        expect(mockChannel).toHaveBeenCalledWith(`chat-${CHAT_ID}`);
    });

    it("se suscribe a INSERT en la tabla messages con el filtro correcto", () => {
        subscribeToMessages(CHAT_ID, jest.fn());
        expect(mockOn).toHaveBeenCalledWith(
            "postgres_changes", // corregido: era "postres_changes"
            expect.objectContaining({
                event: "INSERT",
                table: "messages", // corregido: era "menssages"
                filter: `chat_id=eq.${CHAT_ID}`,
            }),
            expect.any(Function),
        );
    });

    it("llama a onNew con el mensaje cuando llega un payload", async () => {
        const onNew = jest.fn();

        // cadena correcta: .from().select().eq().single()
        const mockSingleFn = jest.fn().mockResolvedValueOnce({ data: mockMessageData, error: null });
        const mockEqFn = jest.fn().mockReturnValue({ single: mockSingleFn });
        const mockSelectFn = jest.fn().mockReturnValue({ eq: mockEqFn });
        mockFrom.mockReturnValue({ select: mockSelectFn });

        subscribeToMessages(CHAT_ID, onNew);
        await capturedPayloadCallback!({ new: { message_id: MESSAGE_ID } });

        expect(mockFrom).toHaveBeenCalledWith("messages");
        expect(onNew).toHaveBeenCalledWith(
            expect.objectContaining({
                content: "Hola",
                shared_post: null,
                shared_fragment: null,
            }),
        );
    });

    it("no llama a onNew si la query no devuelve data", async () => {
        const onNew = jest.fn();

        const mockSingleFn = jest.fn().mockResolvedValueOnce({ data: null, error: null });
        const mockEqFn = jest.fn().mockReturnValue({ single: mockSingleFn });
        const mockSelectFn = jest.fn().mockReturnValue({ eq: mockEqFn });
        mockFrom.mockReturnValue({ select: mockSelectFn });

        subscribeToMessages(CHAT_ID, onNew);
        await capturedPayloadCallback!({ new: { message_id: MESSAGE_ID } });

        expect(onNew).not.toHaveBeenCalled();
    });

    it("devuelve función que llama a removeChannel al desuscribirse", () => {
        const unsub = subscribeToMessages(CHAT_ID, jest.fn());
        unsub();
        expect(mockRemoveChannel).toHaveBeenCalledTimes(1);
    });
});

// subscribeToChatList

describe("subscribeToChatList", () => {
    it("no crea canal si no hay usuario autenticado", async () => {
        mockGetUser.mockReturnValue(
            Promise.resolve({ data: { user: null } }),
        );

        subscribeToChatList(jest.fn());
        await flushPromises();

        expect(mockChannel).not.toHaveBeenCalled();
    });

    it("crea el canal con el nombre correcto para el usuario", async () => {
        subscribeToChatList(jest.fn());
        await flushPromises();

        expect(mockChannel).toHaveBeenCalledWith(`inbox-${USER_ID}`); // corregido: era "ìnbox"
    });

    it("se suscribe a INSERT en messages y chat_members", async () => {
        subscribeToChatList(jest.fn());
        await flushPromises();

        const tables = mockOn.mock.calls.map((c: any[]) => c[1]?.table);
        expect(tables).toContain("messages");
        expect(tables).toContain("chat_members");
    });

    it("elimina canal existente antes de crear uno nuevo", async () => {
        const existingChannel = { topic: `realtime:inbox-${USER_ID}` };
        mockGetChannels.mockReturnValue([existingChannel]);

        subscribeToChatList(jest.fn());
        await flushPromises();

        expect(mockRemoveChannel).toHaveBeenCalledWith(existingChannel);
    });

    it("llama a onUpdate cuando llega un evento", async () => {
        const onUpdate = jest.fn();
        let firstCallback: (() => void) | null = null;

        mockOn.mockImplementation((_event: any, _filter: any, cb: any) => {
            if (!firstCallback && cb) firstCallback = cb;
            return { on: mockOn, subscribe: mockSubscribe };
        });

        subscribeToChatList(onUpdate);
        await flushPromises();

        firstCallback!();
        expect(onUpdate).toHaveBeenCalledTimes(1);
    });

    it("la función de cleanup llama a removeChannel si el canal existe", async () => {
        const unsub = subscribeToChatList(jest.fn());
        await flushPromises(); // await correcto, era flushPromises sin ()

        unsub();
        expect(mockRemoveChannel).toHaveBeenCalled();
    });

    it("la función de cleanup no lanza error si el canal es null", () => {
        mockGetUser.mockReturnValue(
            Promise.resolve({ data: { user: null } }),
        );
        const unsub = subscribeToChatList(jest.fn());
        expect(() => unsub()).not.toThrow();
    });
});