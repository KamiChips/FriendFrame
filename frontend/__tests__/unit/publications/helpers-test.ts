import {
    normalizePagination, sanitizeDescription, parseError,
    assertFriendship, attachCountsBatch, uploadMediaFile,
    deleteMediaFile, notifyNewPublication,
    MAX_PAGE_LIMIT, DEFAULT_LIMIT,
} from "@/services/supabase/posts/helpers";
import { mockFrom, mockStorageFrom, mockRpc } from "@/__mocks__/supabaseMock";

jest.mock("@/lib/supabase/client", () => ({
    supabase: require("@/__mocks__/supabaseMock").supabase,
}));

beforeEach(() => jest.clearAllMocks());

// normalizePagination
describe("normalizePagination", () => {
    it("uses defaults when no params provided", () => {
        const result = normalizePagination({});
        expect(result).toEqual({ from: 0, to: DEFAULT_LIMIT - 1 });
    });

    it("calculates range for page 1", () => {
        const result = normalizePagination({ page: 1, limit: 10 });
        expect(result).toEqual({ from: 10, to: 19 });
    });

    it("clamps limit to MAX_PAGE_LIMIT", () => {
        const result = normalizePagination({ page: 0, limit: 999 });
        expect(result.to - result.from).toBe(MAX_PAGE_LIMIT - 1);
    });

    it("clamps negative page to 0", () => {
        const result = normalizePagination({ page: -5, limit: 10 });
        expect(result.from).toBe(0);
    });
});

// sanitizeDescription
describe("sanitizeDescription", () => {
    it("returns null for undefined", () => expect(sanitizeDescription(undefined)).toBeNull());
    it("returns null for empty string", () => expect(sanitizeDescription("")).toBeNull());
    it("returns null for whitespace only", () => expect(sanitizeDescription("   ")).toBeNull());
    it("trims and returns valid description", () => expect(sanitizeDescription("  hola  ")).toBe("hola"));
    it("throws if description exceeds max length", () => {
        expect(() => sanitizeDescription("a".repeat(2001))).toThrow("La descripción no puede superar 2000 caracteres.");
    });
});

// parseError
describe("parseError", () => {
    it("returns unknown error for null", () => expect(parseError(null)).toBe("Error desconocido"));
    it("maps row-level security error", () => expect(parseError(new Error("row-level security policy"))).toBe("No tienes permiso para realizar esta acción."));
    it("maps foreign key error", () => expect(parseError(new Error("violates foreign key constraint"))).toBe("El usuario o perfil no existe."));
    it("maps NetworkError", () => expect(parseError(new Error("NetworkError occurred"))).toBe("Error de red. Verifica tu conexión."));
    it("maps Failed to fetch", () => expect(parseError(new Error("Failed to fetch"))).toBe("Error de red. Verifica tu conexión."));
    it("passes through known prefixes", () => {
        expect(parseError(new Error("No hay sesión activa."))).toBe("No hay sesión activa.");
        expect(parseError(new Error("Post no encontrado."))).toBe("Post no encontrado.");
        expect(parseError(new Error("Solo puedes publicar en el perfil de tus amigos."))).toBe("Solo puedes publicar en el perfil de tus amigos.");
    });
    it("returns generic error for unknown messages", () => expect(parseError(new Error("algo raro"))).toBe("Ocurrió un error inesperado."));
});

// assertFriendship
describe("assertFriendship", () => {
    it("throws if author is the profile owner", async () => {
        await expect(assertFriendship("uid-1", "uid-1")).rejects.toThrow("No puedes publicar en tu propio perfil.");
    });

    it("throws if rpc returns false", async () => {
        mockRpc.mockResolvedValue({ data: false, error: null });
        await expect(assertFriendship("uid-1", "uid-2")).rejects.toThrow("Solo puedes publicar en el perfil de tus amigos.");
    });

    it("throws if rpc returns error", async () => {
        mockRpc.mockResolvedValue({ data: null, error: new Error("DB error") });
        await expect(assertFriendship("uid-1", "uid-2")).rejects.toThrow();
    });

    it("resolves if friendship exists", async () => {
        mockRpc.mockResolvedValue({ data: true, error: null });
        await expect(assertFriendship("uid-1", "uid-2")).resolves.toBeUndefined();
    });
});

// attachCountsBatch
describe("attachCountsBatch", () => {
    it("returns empty maps if no posts or fragments", async () => {
        const result = await attachCountsBatch([], [], "uid-1");
        expect(result.postsMap.size).toBe(0);
        expect(result.fragmentsMap.size).toBe(0);
    });

    it("maps counts to posts and fragments", async () => {
        mockRpc.mockResolvedValue({
            data: [
                { pub_id: "post-1", pub_type: "post", likes_count: 5, comments_count: 2, shares_count: 1, liked_by_me: true },
                { pub_id: "frag-1", pub_type: "fragment", likes_count: 3, comments_count: 1, shares_count: 0, liked_by_me: false },
            ],
            error: null,
        });

        const posts = [{ post_id: "post-1" }] as any;
        const fragments = [{ fragment_id: "frag-1" }] as any;
        const result = await attachCountsBatch(posts, fragments, "uid-1");

        expect(result.postsMap.get("post-1")).toEqual({ likes_count: 5, comments_count: 2, shares_count: 1, liked_by_me: true });
        expect(result.fragmentsMap.get("frag-1")).toEqual({ likes_count: 3, comments_count: 1, shares_count: 0, liked_by_me: false });
    });

    it("throws if rpc returns error", async () => {
        mockRpc.mockResolvedValue({ data: null, error: new Error("RPC error") });
        await expect(attachCountsBatch([{ post_id: "p1" }] as any, [], "uid-1")).rejects.toThrow();
    });
});

// uploadMediaFile
describe("uploadMediaFile", () => {
    beforeEach(() => {
        global.fetch = jest.fn().mockResolvedValue({ blob: jest.fn().mockResolvedValue(new Blob()) });
    });

    it("uploads image and returns public url", async () => {
        mockStorageFrom.mockReturnValue({
            upload: jest.fn().mockResolvedValue({ error: null }),
            getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: "https://cdn.example.com/file.jpg" } }),
        });

        const url = await uploadMediaFile("uid-1", "file://photo.jpg", "image");
        expect(url).toBe("https://cdn.example.com/file.jpg");
    });

    it("throws if upload fails", async () => {
        mockStorageFrom.mockReturnValue({
            upload: jest.fn().mockResolvedValue({ error: new Error("Upload failed") }),
        });

        await expect(uploadMediaFile("uid-1", "file://photo.jpg", "image")).rejects.toThrow("Upload failed");
    });
});

// deleteMediaFile
describe("deleteMediaFile", () => {
    it("removes file from storage", async () => {
        const mockRemove = jest.fn().mockResolvedValue({ error: null });
        mockStorageFrom.mockReturnValue({ remove: mockRemove });

        await deleteMediaFile("https://cdn.example.com/post-images/uid-1/file.jpg");
        expect(mockRemove).toHaveBeenCalledWith(["uid-1/file.jpg"]);
    });

    it("does nothing if url has no marker", async () => {
        const mockRemove = jest.fn();
        mockStorageFrom.mockReturnValue({ remove: mockRemove });

        await deleteMediaFile("https://cdn.example.com/other/file.jpg");
        expect(mockRemove).not.toHaveBeenCalled();
    });

    it("silently catches errors", async () => {
        mockStorageFrom.mockReturnValue({ remove: jest.fn().mockRejectedValue(new Error("fail")) });
        await expect(deleteMediaFile("https://cdn.example.com/post-images/uid-1/file.jpg")).resolves.toBeUndefined();
    });
});

// notifyNewPublication
describe("notifyNewPublication", () => {
    it("inserts notification for new_post", async () => {
        const mockInsert = jest.fn().mockResolvedValue({ error: null });
        mockFrom.mockReturnValue({ insert: mockInsert });

        notifyNewPublication("owner-1", "actor-1", "new_post", "post-1");
        await new Promise(r => setTimeout(r, 0)); // flush promise

        expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ post_id: "post-1", type: "new_post" }));
    });

    it("inserts notification for new_fragment", async () => {
        const mockInsert = jest.fn().mockResolvedValue({ error: null });
        mockFrom.mockReturnValue({ insert: mockInsert });

        notifyNewPublication("owner-1", "actor-1", "new_fragment", "frag-1");
        await new Promise(r => setTimeout(r, 0));

        expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ fragment_id: "frag-1", type: "new_fragment" }));
    });
});