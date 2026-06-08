import {
    subscribeToMessages,
    subscribeToChatList,
} from "@/services/supabase/chat/chat.realtime";

// Mock state
const mockSubscribe      = jest.fn();
const mockOn             = jest.fn();
const mockChannel        = jest.fn();
const mockRemoveChannel  = jest.fn();
const mockGetChannels    = jest.fn(() => [] as any[]);
const mockGetUser        = jest.fn();
const mockFrom           = jest.fn();

let capturedHandlers: Record<string, Array<(payload: any) => void>> = {};

let currentChannelTopic = "";

// Supabase client mock
jest.mock("@/lib/supabase/client", () => ({
    supabase: {
        from:          (...args: any[]) => mockFrom(...args),
        channel:       (...args: any[]) => mockChannel(...args),
        removeChannel: (...args: any[]) => mockRemoveChannel(...args),
        getChannels:   ()               => mockGetChannels(),
        auth: {
            getUser: () => mockGetUser(),
        },
    },
}));

jest.mock("@/services/supabase/helpers/validation", () => ({
    UUID_REGEX:
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
}));

// Constants
const CHAT_ID    = "550e8400-e29b-41d4-a716-446655440000";
const USER_ID    = "6ba7b810-9dad-41d4-80b4-00c04fd430c8";
const MESSAGE_ID = "6ba7b811-9dad-41d4-80b4-00c04fd430c8";

const mockMessageData = {
    message_id:  MESSAGE_ID,
    chat_id:     CHAT_ID,
    sender_id:   USER_ID,
    content:     "Hola",
    is_read:     false,
    created_at:  "2024-01-01T00:00:00Z",
    sender: {
        user_id:     USER_ID,
        username:    "maydev",
        full_name:   "May",
        profile_pic: null,
    },
};

// Helpers
const flushPromises = () => new Promise<void>((r) => setTimeout(r, 0));

function buildQueryMock(resolvedData: any) {
    const mockSingleFn = jest.fn().mockResolvedValue({ data: resolvedData, error: null });
    const mockEqFn     = jest.fn().mockReturnValue({ single: mockSingleFn });
    const mockSelectFn = jest.fn().mockReturnValue({ eq: mockEqFn });
    mockFrom.mockReturnValue({ select: mockSelectFn });
    return { mockSingleFn, mockEqFn, mockSelectFn };
}

async function triggerAllHandlers(channelTopic: string, payload: any) {
    const handlers = capturedHandlers[channelTopic] ?? [];
    if (!handlers.length) throw new Error(`No handlers captured for topic "${channelTopic}"`);
    for (const h of handlers) await h(payload);
}

//beforeEach
beforeEach(() => {
    jest.clearAllMocks();
    capturedHandlers  = {};
    currentChannelTopic = "";

    mockChannel.mockImplementation((name: string) => {
        currentChannelTopic = name;
        capturedHandlers[name] = [];

        const channelObj: any = {
            on: jest.fn().mockImplementation((_event: any, _filter: any, cb: any) => {
                if (cb) {
                    if (!capturedHandlers[name]) capturedHandlers[name] = [];
                    capturedHandlers[name].push(cb);
                }
                return channelObj;
            }),
            subscribe: jest.fn().mockImplementation(() => {
                mockSubscribe(); 
                return channelObj;
            }),
        };

        return channelObj;
    });

    mockGetUser.mockReturnValue(
        Promise.resolve({ data: { user: { id: USER_ID } } }),
    );

    mockGetChannels.mockReturnValue([]);
});

//  subscribeToMessages
describe("subscribeToMessages", () => {
    //UUID inválido
    describe("cuando el chatId NO es un UUID válido", () => {
        const invalidIds = ["not-a-uuid", "", "123", "550e8400-e29b-41d4-a716"];

        it.each(invalidIds)(
            "retorna función vacía y no crea canal para '%s'",
            (badId) => {
                const unsub = subscribeToMessages(badId, jest.fn());

                expect(mockChannel).not.toHaveBeenCalled();
                expect(typeof unsub).toBe("function");
                expect(() => unsub()).not.toThrow();
            },
        );
    });

    //UUID válido
    describe("cuando el chatId ES un UUID válido", () => {

        it("crea el canal con el nombre correcto", () => {
            subscribeToMessages(CHAT_ID, jest.fn());
            expect(mockChannel).toHaveBeenCalledWith(`chat-${CHAT_ID}`);
        });

        it("llama a .subscribe() exactamente una vez", () => {
            subscribeToMessages(CHAT_ID, jest.fn());
            expect(mockSubscribe).toHaveBeenCalledTimes(1);
        });

        it("registra el handler de postgres_changes con el filtro correcto", () => {
            subscribeToMessages(CHAT_ID, jest.fn());

            const channelObj = mockChannel.mock.results[0].value;
            expect(channelObj.on).toHaveBeenCalledWith(
                "postgres_changes",
                expect.objectContaining({
                    event:  "INSERT",
                    schema: "public",
                    table:  "messages",
                    filter: `chat_id=eq.${CHAT_ID}`,
                }),
                expect.any(Function),
            );
        });

        it("retorna una función de cleanup", () => {
            const unsub = subscribeToMessages(CHAT_ID, jest.fn());
            expect(typeof unsub).toBe("function");
        });

        it("la función de cleanup llama a removeChannel", () => {
            const unsub = subscribeToMessages(CHAT_ID, jest.fn());
            unsub();
            expect(mockRemoveChannel).toHaveBeenCalledTimes(1);
        });

        it("llama a onNew con el mensaje correcto al recibir un INSERT", async () => {
            buildQueryMock(mockMessageData);
            const onNew = jest.fn();

            subscribeToMessages(CHAT_ID, onNew);
            await triggerAllHandlers(`chat-${CHAT_ID}`, { new: { message_id: MESSAGE_ID } });

            expect(onNew).toHaveBeenCalledTimes(1);
            expect(onNew).toHaveBeenCalledWith(
                expect.objectContaining({
                    content:         "Hola",
                    shared_post:     null,
                    shared_fragment: null,
                }),
            );
        });

        it("hace la query correcta a Supabase al recibir el payload", async () => {
            const { mockSelectFn, mockEqFn } = buildQueryMock(mockMessageData);

            subscribeToMessages(CHAT_ID, jest.fn());
            await triggerAllHandlers(`chat-${CHAT_ID}`, { new: { message_id: MESSAGE_ID } });

            expect(mockFrom).toHaveBeenCalledWith("messages");
            expect(mockSelectFn).toHaveBeenCalledWith(
                expect.stringContaining("sender:users!sender_id"),
            );
            expect(mockEqFn).toHaveBeenCalledWith("message_id", MESSAGE_ID);
        });

        it("no llama a onNew si la query retorna data: null", async () => {
            buildQueryMock(null);
            const onNew = jest.fn();

            subscribeToMessages(CHAT_ID, onNew);
            await triggerAllHandlers(`chat-${CHAT_ID}`, { new: { message_id: MESSAGE_ID } });

            expect(onNew).not.toHaveBeenCalled();
        });

        it("fuerza shared_post y shared_fragment a null aunque la DB devuelva valores", async () => {
            buildQueryMock({
                ...mockMessageData,
                shared_post:     { id: "post-1" },
                shared_fragment: { id: "frag-1" },
            });
            const onNew = jest.fn();

            subscribeToMessages(CHAT_ID, onNew);
            await triggerAllHandlers(`chat-${CHAT_ID}`, { new: { message_id: MESSAGE_ID } });

            expect(onNew).toHaveBeenCalledWith(
                expect.objectContaining({
                    shared_post:     null,
                    shared_fragment: null,
                }),
            );
        });

        it("maneja correctamente múltiples INSERTs consecutivos", async () => {
            const msgs = [
                { ...mockMessageData, message_id: "msg-a", content: "Primero" },
                { ...mockMessageData, message_id: "msg-b", content: "Segundo" },
            ];
            let callIdx = 0;
            const mockSingleFn = jest.fn().mockImplementation(() =>
                Promise.resolve({ data: msgs[callIdx++], error: null }),
            );
            const mockEqFn     = jest.fn().mockReturnValue({ single: mockSingleFn });
            const mockSelectFn = jest.fn().mockReturnValue({ eq: mockEqFn });
            mockFrom.mockReturnValue({ select: mockSelectFn });

            const onNew = jest.fn();
            subscribeToMessages(CHAT_ID, onNew);

            await triggerAllHandlers(`chat-${CHAT_ID}`, { new: { message_id: "msg-a" } });
            await triggerAllHandlers(`chat-${CHAT_ID}`, { new: { message_id: "msg-b" } });

            expect(onNew).toHaveBeenCalledTimes(2);
            expect(onNew.mock.calls[0][0].content).toBe("Primero");
            expect(onNew.mock.calls[1][0].content).toBe("Segundo");
        });

        it("el mensaje recibido en onNew contiene los campos del sender", async () => {
            buildQueryMock(mockMessageData);
            const onNew = jest.fn();

            subscribeToMessages(CHAT_ID, onNew);
            await triggerAllHandlers(`chat-${CHAT_ID}`, { new: { message_id: MESSAGE_ID } });

            const received = onNew.mock.calls[0][0];
            expect(received.sender).toMatchObject({
                user_id:     USER_ID,
                username:    "maydev",
                full_name:   "May",
                profile_pic: null,
            });
        });
    });
});

//  subscribeToChatList
describe("subscribeToChatList", () => {
    describe("cuando NO hay usuario autenticado", () => {
        beforeEach(() => {
            mockGetUser.mockReturnValue(
                Promise.resolve({ data: { user: null } }),
            );
        });

        it("no crea ningún canal", async () => {
            subscribeToChatList(jest.fn());
            await flushPromises();
            expect(mockChannel).not.toHaveBeenCalled();
        });

        it("retorna función de cleanup que no lanza error", async () => {
            const unsub = subscribeToChatList(jest.fn());
            await flushPromises();
            expect(() => unsub()).not.toThrow();
        });

        it("la función de cleanup no llama a removeChannel si nunca se creó canal", async () => {
            const unsub = subscribeToChatList(jest.fn());
            await flushPromises();
            unsub();
            expect(mockRemoveChannel).not.toHaveBeenCalled();
        });
    });

    //Usuario autenticado
    describe("cuando hay usuario autenticado", () => {

        it("crea el canal con nombre inbox-{userId}", async () => {
            subscribeToChatList(jest.fn());
            await flushPromises();
            expect(mockChannel).toHaveBeenCalledWith(`inbox-${USER_ID}`);
        });

        it("llama a .subscribe() una sola vez", async () => {
            subscribeToChatList(jest.fn());
            await flushPromises();
            expect(mockSubscribe).toHaveBeenCalledTimes(1);
        });

        it("registra suscripción a INSERT en messages (sin filtro de usuario)", async () => {
            subscribeToChatList(jest.fn());
            await flushPromises();

            const channelObj = mockChannel.mock.results[0].value;
            const onCalls: any[][] = channelObj.on.mock.calls;

            const tables = onCalls.map((c) => c[1]?.table);
            expect(tables).toContain("messages");

            const messagesCall = onCalls.find((c) => c[1]?.table === "messages");
            expect(messagesCall).toBeDefined();
            const messagesCallDef = messagesCall!;
            expect(messagesCallDef[1]).toMatchObject({
                event:  "INSERT",
                schema: "public",
                table:  "messages",
            });
        });

        it("registra suscripción a INSERT en chat_members filtrada por userId", async () => {
            subscribeToChatList(jest.fn());
            await flushPromises();

            const channelObj = mockChannel.mock.results[0].value;
            const onCalls: any[][] = channelObj.on.mock.calls;

            const membersCall = onCalls.find((c) => c[1]?.table === "chat_members");
            expect(membersCall).toBeDefined();
            const membersCallDef = membersCall!;
            expect(membersCallDef[1]).toMatchObject({
                event:  "INSERT",
                schema: "public",
                table:  "chat_members",
                filter: `user_id=eq.${USER_ID}`,
            });
        });

        it("llama a onUpdate cuando llega un INSERT en messages", async () => {
            const onUpdate = jest.fn();
            subscribeToChatList(onUpdate);
            await flushPromises();

            const handlers = capturedHandlers[`inbox-${USER_ID}`] ?? [];
            expect(handlers.length).toBeGreaterThan(0);
            handlers[0]({ new: {} });

            expect(onUpdate).toHaveBeenCalled();
        });

        it("llama a onUpdate cuando llega un INSERT en chat_members", async () => {
            const onUpdate = jest.fn();
            subscribeToChatList(onUpdate);
            await flushPromises();

            const handlers = capturedHandlers[`inbox-${USER_ID}`] ?? [];
            handlers.forEach((h) => h({ new: {} }));

            expect(onUpdate).toHaveBeenCalled();
        });

        it("elimina canal existente con el mismo topic antes de crear uno nuevo", async () => {
            const existingChannel = { topic: `realtime:inbox-${USER_ID}` };
            mockGetChannels.mockReturnValue([existingChannel]);

            subscribeToChatList(jest.fn());
            await flushPromises();

            expect(mockRemoveChannel).toHaveBeenCalledWith(existingChannel);
        });

        it("NO elimina canales de otros topics", async () => {
            const otherChannel = { topic: "realtime:inbox-otro-user" };
            mockGetChannels.mockReturnValue([otherChannel]);

            subscribeToChatList(jest.fn());
            await flushPromises();

            expect(mockRemoveChannel).not.toHaveBeenCalledWith(otherChannel);
        });

        it("la función de cleanup llama a removeChannel con el canal correcto", async () => {
            const unsub = subscribeToChatList(jest.fn());
            await flushPromises();

            unsub();
            expect(mockRemoveChannel).toHaveBeenCalledTimes(1);
        });

        it("la función de cleanup NO lanza error si se llama antes de que resuelva getUser", () => {
            mockGetUser.mockReturnValue(new Promise(() => {}));

            const unsub = subscribeToChatList(jest.fn());
            expect(() => unsub()).not.toThrow();
            expect(mockRemoveChannel).not.toHaveBeenCalled();
        });
    });

    // getUser rechaza 
    describe("cuando getUser rechaza", () => {
        it("no crea canal y la función de cleanup es segura", async () => {
            mockGetUser.mockReturnValue(
                Promise.resolve({ data: { user: null } }),
            );

            const unsub = subscribeToChatList(jest.fn());
            await flushPromises();

            expect(mockChannel).not.toHaveBeenCalled();
            expect(() => unsub()).not.toThrow();
        });

        it("la promesa pendiente (timeout de red) no lanza y cleanup es seguro", () => {
            mockGetUser.mockReturnValue(new Promise(() => {}));

            const unsub = subscribeToChatList(jest.fn());

            expect(mockChannel).not.toHaveBeenCalled();
            expect(() => unsub()).not.toThrow();
        });
    });
});

//  Aislamiento entre suscripciones
describe("aislamiento entre suscripciones concurrentes", () => {

    const CHAT_ID_2 = "7ba7b810-9dad-41d4-80b4-00c04fd430c8";

    it("dos subscribeToMessages crean canales independientes", () => {
        subscribeToMessages(CHAT_ID,   jest.fn());
        subscribeToMessages(CHAT_ID_2, jest.fn());

        expect(mockChannel).toHaveBeenCalledWith(`chat-${CHAT_ID}`);
        expect(mockChannel).toHaveBeenCalledWith(`chat-${CHAT_ID_2}`);
        expect(mockSubscribe).toHaveBeenCalledTimes(2);
    });

    it("hacer unsub de un canal no afecta al otro", () => {
        const unsub1 = subscribeToMessages(CHAT_ID,   jest.fn());
        subscribeToMessages(CHAT_ID_2, jest.fn());

        const channelObj1 = mockChannel.mock.results[0].value;
        const channelObj2 = mockChannel.mock.results[1].value;

        unsub1();

        expect(mockRemoveChannel).toHaveBeenCalledTimes(1);
        expect(mockRemoveChannel).toHaveBeenCalledWith(channelObj1);
        expect(mockRemoveChannel).not.toHaveBeenCalledWith(channelObj2);
    });

    it("subscribeToChatList y subscribeToMessages coexisten sin interferencia", async () => {
        subscribeToMessages(CHAT_ID, jest.fn());

        subscribeToChatList(jest.fn());
        await flushPromises();

        expect(mockChannel).toHaveBeenCalledWith(`chat-${CHAT_ID}`);
        expect(mockChannel).toHaveBeenCalledWith(`inbox-${USER_ID}`);
        expect(mockSubscribe).toHaveBeenCalledTimes(2);
    });
});