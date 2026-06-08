import {
    assertNotificationType,
    normalizePagination,
    NOTIFICATION_SELECT,
} from "@/services/supabase/notifications/notification.helpers";

// Mock de tipos
jest.mock("@/services/supabase/notifications/notification.types", () => ({
    DEFAULT_LIMIT:   10,
    MAX_PAGE_LIMIT:  50,
    VALID_TYPES: new Set(["like", "comment", "follow", "mention", "message"]),
}));

//  assertNotificationType
describe("assertNotificationType", () => {

    describe("tipos válidos", () => {
        const validTypes = ["like", "comment", "follow", "mention", "message"];

        it.each(validTypes)("no lanza para el tipo '%s'", (type) => {
            expect(() => assertNotificationType(type)).not.toThrow();
        });

        it.each(validTypes)(
            "actúa como type guard: el tipo '%s' pasa sin modificarse",
            (type) => {
                let result: string = type;
                expect(() => {
                    assertNotificationType(result);
                }).not.toThrow();
            },
        );
    });

    describe("tipos inválidos", () => {
        const invalidTypes = [
            "LIKE",
            "Like",
            "unknown",
            "",
            " ",
            "like ",
            " like",
            "follow\n",
            "null",
            "undefined",
            "123",
        ];

        it.each(invalidTypes)("lanza para el tipo inválido '%s'", (type) => {
            expect(() => assertNotificationType(type)).toThrow(
                `Tipo de notificación inválido: ${type}`,
            );
        });

        it("el mensaje de error incluye el tipo recibido", () => {
            const badType = "nonexistent_type";
            expect(() => assertNotificationType(badType)).toThrow(
                new Error(`Tipo de notificación inválido: ${badType}`),
            );
        });

        it("lanza un Error (no una string ni otro tipo)", () => {
            expect(() => assertNotificationType("bad")).toThrowError(Error);
        });
    });
});

//  normalizePagination
describe("normalizePagination", () => {
    it("retorna { from: 0, to: 9 } con valores por defecto (page=0, limit=10)", () => {
        expect(normalizePagination()).toEqual({ from: 0, to: 9 });
    });

    it("page=0, limit=10  →  from=0,  to=9", () => {
        expect(normalizePagination(0, 10)).toEqual({ from: 0, to: 9 });
    });

    it("page=1, limit=10  →  from=10, to=19", () => {
        expect(normalizePagination(1, 10)).toEqual({ from: 10, to: 19 });
    });

    it("page=2, limit=10  →  from=20, to=29", () => {
        expect(normalizePagination(2, 10)).toEqual({ from: 20, to: 29 });
    });

    it("page=0, limit=1   →  from=0,  to=0  (limit mínimo: 1)", () => {
        expect(normalizePagination(0, 1)).toEqual({ from: 0, to: 0 });
    });

    it("page=3, limit=5   →  from=15, to=19", () => {
        expect(normalizePagination(3, 5)).toEqual({ from: 15, to: 19 });
    });

    it("limit=50 (MAX)    →  no se recorta", () => {
        expect(normalizePagination(0, 50)).toEqual({ from: 0, to: 49 });
    });

    it("limit=51 (> MAX)  →  se recorta a 50", () => {
        expect(normalizePagination(0, 51)).toEqual({ from: 0, to: 49 });
    });

    it("limit=1000        →  se recorta a 50", () => {
        expect(normalizePagination(0, 1000)).toEqual({ from: 0, to: 49 });
    });

    it("limit=50 + page=1 →  from=50, to=99", () => {
        expect(normalizePagination(1, 50)).toEqual({ from: 50, to: 99 });
    });

    it("page negativa (-1)  →  se normaliza a 0", () => {
        expect(normalizePagination(-1, 10)).toEqual({ from: 0, to: 9 });
    });

    it("page negativa (-99) →  se normaliza a 0", () => {
        expect(normalizePagination(-99, 10)).toEqual({ from: 0, to: 9 });
    });

    it("page=100, limit=10  →  from=1000, to=1009", () => {
        expect(normalizePagination(100, 10)).toEqual({ from: 1000, to: 1009 });
    });

    it("limit=0   →  se eleva a 1 (mínimo)", () => {
        expect(normalizePagination(0, 0)).toEqual({ from: 0, to: 0 });
    });

    it("limit=-5  →  se eleva a 1 (mínimo)", () => {
        expect(normalizePagination(0, -5)).toEqual({ from: 0, to: 0 });
    });

    it("limit=-1  →  se eleva a 1; page=2 → from=2, to=2", () => {
        expect(normalizePagination(2, -1)).toEqual({ from: 2, to: 2 });
    });

    it("page=1.9  →  se hace floor a 1", () => {
        expect(normalizePagination(1.9, 10)).toEqual({ from: 10, to: 19 });
    });

    it("page=0.5  →  se hace floor a 0", () => {
        expect(normalizePagination(0.5, 10)).toEqual({ from: 0, to: 9 });
    });

    it("limit=10.9 →  se hace floor a 10", () => {
        expect(normalizePagination(0, 10.9)).toEqual({ from: 0, to: 9 });
    });

    it("limit=1.1  →  se hace floor a 1", () => {
        expect(normalizePagination(0, 1.1)).toEqual({ from: 0, to: 0 });
    });

    it("sin page  (undefined) →  usa DEFAULT_LIMIT=10, page=0", () => {
        expect(normalizePagination(undefined, 10)).toEqual({ from: 0, to: 9 });
    });

    it("sin limit (undefined) →  usa DEFAULT_LIMIT=10, page=0", () => {
        expect(normalizePagination(0, undefined)).toEqual({ from: 0, to: 9 });
    });

    it("sin ningún argumento  →  from=0, to=9", () => {
        expect(normalizePagination()).toEqual({ from: 0, to: 9 });
    });

    const cases = [
        [0, 10], [1, 10], [2, 5], [0, 1], [3, 25], [10, 50],
    ] as const;

    it.each(cases)(
        "invariante to = from + limit - 1  (page=%i, limit=%i)",
        (page, limit) => {
            const { from, to } = normalizePagination(page, limit);
            expect(to - from + 1).toBe(limit);
        },
    );
});

//  NOTIFICATION_SELECT
describe("NOTIFICATION_SELECT", () => {
    it("es una cadena de texto", () => {
        expect(typeof NOTIFICATION_SELECT).toBe("string");
    });

    it("incluye el campo notification_id", () => {
        expect(NOTIFICATION_SELECT).toMatch(/notification_id/);
    });

    it("incluye el campo user_id", () => {
        expect(NOTIFICATION_SELECT).toMatch(/\buser_id\b/);
    });

    it("incluye el campo type", () => {
        expect(NOTIFICATION_SELECT).toMatch(/\btype\b/);
    });

    it("incluye el campo is_read", () => {
        expect(NOTIFICATION_SELECT).toMatch(/\bis_read\b/);
    });

    it("incluye el campo created_at", () => {
        expect(NOTIFICATION_SELECT).toMatch(/\bcreated_at\b/);
    });

    it("incluye el join de actor con users!actor_id", () => {
        expect(NOTIFICATION_SELECT).toMatch(/actor:users!actor_id/);
    });

    it("el join de actor selecciona user_id, username, full_name, profile_pic", () => {
        expect(NOTIFICATION_SELECT).toMatch(/user_id.*username.*full_name.*profile_pic/s);
    });

    it("incluye el join de post con posts!post_id", () => {
        expect(NOTIFICATION_SELECT).toMatch(/post:posts!post_id/);
    });

    it("el join de post selecciona post_id, media, description", () => {
        expect(NOTIFICATION_SELECT).toMatch(/post_id.*media.*description/s);
    });

    it("incluye el join de fragment con fragments!fragment_id", () => {
        expect(NOTIFICATION_SELECT).toMatch(/fragment:fragments!fragment_id/);
    });

    it("el join de fragment selecciona fragment_id, content", () => {
        expect(NOTIFICATION_SELECT).toMatch(/fragment_id.*content/s);
    });

    it("incluye el join de message con messages!message_id", () => {
        expect(NOTIFICATION_SELECT).toMatch(/message:messages!message_id/);
    });

    it("el join de message selecciona message_id, content, chat_id", () => {
        expect(NOTIFICATION_SELECT).toMatch(/message_id.*content.*chat_id/s);
    });

    it("no tiene espacios o saltos de línea inesperados que rompan la query (no empieza con espacio)", () => {
        expect(NOTIFICATION_SELECT.trimStart()).toBe(NOTIFICATION_SELECT.trimStart());
    });
});