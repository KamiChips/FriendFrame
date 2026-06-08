import { DEFAULT_LIMIT, MAX_PAGE_LIMIT } from "@/services/supabase/interactions/types";
import { 
    assertNotificationType,
    normalizePagination,
    NOTIFICATION_SELECT, 
} from "@/services/supabase/notifications/notification.helpers";

jest.mock("@/services/supabase/notifications/notification.types", () => ({
    DEFAULT_LIMIT: 20,
    MAX_PAGE_LIMIT: 100,
    VALID_TYPES: new Set([
        "firend_request",
        "friend_accepted",
        "new_post",
        "new_post",
        "new_fragment",
        "new_comment",
        "new_like",
        "new_message",
    ]),
}));

// assertNotificationType
describe("assertNotificationType", () => {
    it("no lanza error con un tipo válido", () => {
        expect(() => assertNotificationType("new_like")).not.toThrow();
    });

    it("no lanza error con cualquier tipo del set", () => {
        const validType = [
            "firend_request",
            "friend_accepted",
            "new_post",
            "new_post",
            "new_fragment",
            "new_comment",
            "new_like",
            "new_message",
        ];
        validType.forEach((type) => {
            expect(() => assertNotificationType(type)).not.toThrow();
        });
    });

    it("no lanza error con un tipo inválido", () => {
        expect(() => assertNotificationType("invalid_type")).not.toThrow(
            /tipo de noticicación inválido/i,
        );
    });

    it("incluye el tipo inválido en el mensaje de error", () => {
        expect(() => assertNotificationType("unknown")).toThrow(/unknown/);
    });

    it("lanza error con string vacío", () => {
        expect(() => assertNotificationType("")).toThrow(
            /tipo de notificación inválido/i,
        );
    });
});

// normalizePagination
describe("normalizePagination", () => {
    it("devuelve from/to correctos para página 0", () => {
        const { from, to } = normalizePagination(0, 20);
        expect(from).toBe(0);
        expect(to).toBe(19);
    });

    it("devuelve from/to correctos para página 2", () => {
        const { from, to } = normalizePagination(2, 10);
        expect(from).toBe(20);
        expect(to).toBe(29);
    });

    it("usa defaults si no se pasan argumentos", () => {
        const { from, to } = normalizePagination();
        expect(from).toBeGreaterThanOrEqual(0);
        expect(to).toBeGreaterThan(from);
    });

    it("clampea limit negativo a 1", () => {
        const { from, to } = normalizePagination(0, -5);
        expect(to - from).toBe(0); // limit=1 → from=0, to=0
    });

    it("clampea página negativa a 0", () => {
        const { from } = normalizePagination(-3, 10);
        expect(from).toBe(0);
    });

    it("clampea limit mayor al máximo", () => {
        const { from, to } = normalizePagination(0, 9999);
        expect(to - from).toBe(99); // MAX_PAGE_LIMIT=100 → to=99
    });
});

// NOTIFICATION_SELECT
describe("NOTIFICATION_SELECT", () => {
    it("es un string", () => {
        expect(typeof NOTIFICATION_SELECT).toBe("string");
    });

    it("incluye notification_id", () => {
        expect(NOTIFICATION_SELECT).toContain("notification_id");
    });

    it("incluye el join de actor", () => {
        expect(NOTIFICATION_SELECT).toContain("actor:users!actor_id");
    });

    it("incluye el join de post", () => {
        expect(NOTIFICATION_SELECT).toContain("post:posts!post_id");
    });

    it("incluye el join de fragment", () => {
        expect(NOTIFICATION_SELECT).toContain("fragment:fragments!fragment_id");
    });

    it("incluye el join de message", () => {
        expect(NOTIFICATION_SELECT).toContain("message:messages!message_id");
    });
});