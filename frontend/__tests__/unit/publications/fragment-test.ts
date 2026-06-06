import { createFragment, editFragment, deleteFragment, getFragmentWithCounts, getUserFragments } from "@/services/supabase/posts/fragment";
import { mockFrom } from "@/__mocks__/supabaseMock";
import { getAuthUser } from "@/services/supabase/helpers/validation";
import { assertFriendship, attachCountsBatch, notifyNewPublication } from "@/services/supabase/posts/helpers";

jest.mock("@/lib/supabase/client", () => ({
    supabase: require("@/__mocks__/supabaseMock").supabase,
}));
jest.mock("@/services/supabase/helpers/validation", () => ({
    ...jest.requireActual("@/services/supabase/helpers/validation"),
    getAuthUser: jest.fn(),
}));
jest.mock("@/services/supabase/posts/helpers", () => ({
    ...jest.requireActual("@/services/supabase/posts/helpers"),
    assertFriendship: jest.fn(),
    notifyNewPublication: jest.fn(),
    attachCountsBatch: jest.fn(),
}));

const mockGetAuthUser = getAuthUser as jest.Mock;
const mockAssertFriendship = assertFriendship as jest.Mock;
const mockAttachCountsBatch = attachCountsBatch as jest.Mock;

const currentUserId  = "550e8400-e29b-41d4-a716-446655440000";
const profileOwnerId = "550e8400-e29b-41d4-a716-446655440001";
const fragment = { fragment_id: "550e8400-e29b-41d4-a716-446655440020", content: "nuevo contenido" };

// helpers
const single = (data: any, error: any = null) =>
    jest.fn().mockResolvedValue({ data, error });

const insertChain = (data: any, error: any = null) => ({
    insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({ single: single(data, error) }),
    }),
});

const updateChain = (data: any, error: any = null) => ({
    update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({ single: single(data, error) }),
            }),
        }),
    }),
});

const deleteChain = (error: any = null) => ({
    delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error }),
        }),
    }),
});

const selectSingleEqChain = (data: any, error: any = null) => ({
    select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({ single: single(data, error) }),
    }),
});

beforeEach(() => {
    jest.clearAllMocks();
    mockGetAuthUser.mockResolvedValue(currentUserId);
    mockAssertFriendship.mockResolvedValue(undefined);
});

describe("createFragment", () => {
    it("creates fragment successfully", async () => {
        mockFrom.mockReturnValue(insertChain(fragment));
        const result = await createFragment(profileOwnerId, "hola");
        expect(result).toEqual({ data: fragment, error: null });
        expect(notifyNewPublication).toHaveBeenCalled();
    });

    it("returns error when content is empty", async () => {
        const result = await createFragment(profileOwnerId, "      ");
        expect(result.error).toBe("El fragment no puede estar vacío.");
    });

    it("returns error when content exceeds max length", async () => {
        const result = await createFragment(profileOwnerId, "a".repeat(2001));
        expect(result.error).toBe("El fragment no puede superar 2000 caracteres.");
    });

    it("returns error if profileOwnerId is invalid", async () => {
        const result = await createFragment("no-es-uuid", "hola");
        expect(result.data).toBeNull();
        expect(result.error).toContain("ID de perfil");
    });

    it("returns error if user is not authenticated", async () => {
        mockGetAuthUser.mockRejectedValue(new Error("No hay sesión activa."));
        const result = await createFragment(profileOwnerId, "hola");
        expect(result).toEqual({ data: null, error: "No hay sesión activa." });
        expect(mockAssertFriendship).not.toHaveBeenCalled();
    });

    it("returns error when friendship check fails", async () => {
        mockAssertFriendship.mockRejectedValue(new Error("Solo puedes publicar en el perfil de tus amigos."));
        const result = await createFragment(profileOwnerId, "hola");
        expect(result.error).toBe("Solo puedes publicar en el perfil de tus amigos.");
    });

    it("returns error if insert fails", async () => {
        mockFrom.mockReturnValue(insertChain(null, new Error("DB Error")));
        const result = await createFragment(profileOwnerId, "hola");
        expect(result.error).toBe("Ocurrió un error inesperado.");
    });
});

describe("editFragment", () => {
    it("updates a fragment successfully", async () => {
        mockFrom.mockReturnValue(updateChain(fragment));
        const result = await editFragment(fragment.fragment_id, "nuevo contenido");
        expect(result).toEqual({ data: fragment, error: null });
    });

    it("returns error when content is empty", async () => {
        const result = await editFragment(fragment.fragment_id, "   ");
        expect(result.error).toBe("El fragment no puede estar vacío.");
    });

    it("returns error when content exceeds max length", async () => {
        const result = await editFragment(fragment.fragment_id, "a".repeat(2001));
        expect(result.error).toBe("El fragment no puede superar 2000 caracteres.");
    });

    it("returns error when fragment does not exist", async () => {
        mockFrom.mockReturnValue(updateChain(null));
        const result = await editFragment(fragment.fragment_id, "nuevo contenido");
        expect(result.error).toBe("Fragment no encontrado o sin permisos.");
    });

    it("returns error when update fails with DB error", async () => {
        mockFrom.mockReturnValue(updateChain(null, new Error("DB Error")));
        const result = await editFragment(fragment.fragment_id, "nuevo contenido");
        expect(result.error).toBe("Ocurrió un error inesperado.");
    });
});

describe("deleteFragment", () => {
    it("deletes a fragment successfully", async () => {
        mockFrom.mockReturnValue(deleteChain());
        const result = await deleteFragment(fragment.fragment_id);
        expect(result).toEqual({ data: null, error: null });
    });

    it("returns error when delete fails", async () => {
        mockFrom.mockReturnValue(deleteChain(new Error("DB Error")));
        const result = await deleteFragment(fragment.fragment_id);
        expect(result.error).toBe("Ocurrió un error inesperado.");
    });

    it("returns error if user is not authenticated", async () => {
        mockGetAuthUser.mockRejectedValue(new Error("No hay sesión activa."));
        const result = await deleteFragment(fragment.fragment_id);
        expect(result).toEqual({ data: null, error: "No hay sesión activa." });
    });
});

describe("getFragmentWithCounts", () => {
    beforeEach(() => {
        mockFrom.mockReturnValue(selectSingleEqChain(fragment));
        mockAttachCountsBatch.mockResolvedValue({ postsMap: new Map(), fragmentsMap: new Map() });
    });

    it("returns fragment with counts", async () => {
        mockAttachCountsBatch.mockResolvedValue({
            postsMap: new Map(),
            fragmentsMap: new Map([[fragment.fragment_id, { likes_count: 10, comments_count: 5, shares_count: 2, liked_by_me: true }]]),
        });
        const result = await getFragmentWithCounts(fragment.fragment_id, currentUserId);
        expect(result.data).toEqual({ ...fragment, likes_count: 10, comments_count: 5, shares_count: 2, liked_by_me: true });
    });

    it("returns default counts when fragment has no counts", async () => {
        const result = await getFragmentWithCounts(fragment.fragment_id, currentUserId);
        expect(result.data).toEqual({ ...fragment, likes_count: 0, comments_count: 0, shares_count: 0, liked_by_me: false });
    });

    it("returns error if currentUserId is invalid", async () => {
        const result = await getFragmentWithCounts(fragment.fragment_id, "no-es-uuid");
        expect(result.data).toBeNull();
        expect(result.error).toContain("ID de usuario");
    });

    it("returns error if query fails", async () => {
        mockFrom.mockReturnValue(selectSingleEqChain(null, new Error("DB Error")));
        const result = await getFragmentWithCounts(fragment.fragment_id, currentUserId);
        expect(result.error).toBeTruthy();
    });
});

describe("getUserFragments", () => {
    it("queries user fragments ordered by date", async () => {
        const order = jest.fn();
        const eq = jest.fn().mockReturnValue({ order });
        const select = jest.fn().mockReturnValue({ eq });
        mockFrom.mockReturnValue({ select });

        await getUserFragments(currentUserId);

        expect(mockFrom).toHaveBeenCalledWith("fragments");
        expect(eq).toHaveBeenCalledWith("author_id", currentUserId);
        expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
    });
});