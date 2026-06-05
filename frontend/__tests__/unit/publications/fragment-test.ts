import { createFragment, editFragment, deleteFragment,getFragmentWithCounts, getUserFragments } from "@/services/supabase/posts/fragment";
import { mockFrom } from "@/__mocks__/supabaseMock";

import { getAuthUser } from "@/services/supabase/helpers/validation";

import {
    assertFriendship,
    attachCountsBatch,
    notifyNewPublication,
} from "@/services/supabase/posts/helpers";

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


const currentUserId = "550e8400-e29b-41d4-a716-446655440000";

const profileOwnerId = "550e8400-e29b-41d4-a716-446655440001";

const fragment = {
    fragment_id: "550e8400-e29b-41d4-a716-446655440020",
    content: "nuevo contenido",
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe("create fragment", () => {
    it("creates fragment successfully", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);

        mockAssertFriendship.mockResolvedValue(undefined);

        const fragment = {
        fragment_id: "fragment-1",
        content: "hola",
        };

        const single = jest.fn().mockResolvedValue({
        data: fragment,
        error: null,
        });

        const select = jest.fn().mockReturnValue({
        single,
        });

        const insert = jest.fn().mockReturnValue({
        select,
        });

        mockFrom.mockReturnValue({
        insert,
        });

        const result = await createFragment(
        profileOwnerId,
        "hola",
        );

        expect(result).toEqual({
        data: fragment,
        error: null,
        });

        expect(notifyNewPublication).toHaveBeenCalled();
    });

    it("returns error when fragment content is empty", async () => {
        const result = await createFragment(
        profileOwnerId,
        "      ",
        );

        expect(result.error).toBe(
        "El fragment no puede estar vacío."
        );
    });

    it("returns error when fragment exceeds max length", async () => {
        const content = "a".repeat(2001);

        const result = await createFragment(
            profileOwnerId,
            content,
        );

        expect(result.error).toBe(
            "El fragment no puede superar 2000 caracteres."
        );
    });

    it("returns error when friendship check fails", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);

        mockAssertFriendship.mockRejectedValue(
        new Error(
            "Solo puedes publicar en el perfil de tus amigos.",
        ),
        );

        const result = await createFragment(
        profileOwnerId,
        "hola",
        );

        expect(result.error).toBe(
        "Solo puedes publicar en el perfil de tus amigos.",
        );
    });

    it("returns error if insert fails", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);

        mockAssertFriendship.mockResolvedValue(undefined);

        const single = jest.fn().mockResolvedValue({
            data: null,
            error: new Error("DB Error"),
        });

        const select = jest.fn().mockReturnValue({ single });

        const insert = jest.fn().mockReturnValue({ select });

        mockFrom.mockReturnValue({ insert });

        const result = await createFragment(
            profileOwnerId,
            "hola",
        );

        expect(result.error).toBe(
            "Ocurrió un error inesperado."
        );
    });
});

describe("edit fragment", () => {
    it("updates a fragment successfully", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);

        const single = jest.fn().mockResolvedValue({
            data: fragment,
            error: null,
        });

        const select = jest.fn().mockReturnValue({ single });

        const eq2 = jest.fn().mockReturnValue({ select });

        const eq1 = jest.fn().mockReturnValue({
            eq: eq2,
        });

        const update = jest.fn().mockReturnValue({
            eq: eq1,
        });

        mockFrom.mockReturnValue({
            update,
        });

        const result = await editFragment(
            fragment.fragment_id,
            "nuevo contenido",
        );

        expect(result).toEqual({
            data: fragment,
            error: null,
        });
    });

    it("returns error when content is empty", async () => {
        const result = await editFragment(
            fragment.fragment_id,
            "   ",
        );

        expect(result.error).toBe(
            "El fragment no puede estar vacío."
        );
    });

    it("returns error when content exceeds max length", async () => {
        const result = await editFragment(
            fragment.fragment_id,
            "a".repeat(2001),
        );

        expect(result.error).toBe(
            "El fragment no puede superar 2000 caracteres."
        );
    });

    it("returns error when fragment does not exist", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);

        const single = jest.fn().mockResolvedValue({
            data: null,
            error: null,
        });

        const select = jest.fn().mockReturnValue({ single });

        const eq2 = jest.fn().mockReturnValue({ select });

        const eq1 = jest.fn().mockReturnValue({
            eq: eq2,
        });

        const update = jest.fn().mockReturnValue({
            eq: eq1,
        });

        mockFrom.mockReturnValue({
            update,
        });

        const result = await editFragment(
            fragment.fragment_id,
            "nuevo contenido",
        );

        expect(result.error).toBe(
            "Fragment no encontrado o sin permisos."
        );
    });
});

describe("delete fragment", () => {
    it("deletes a fragment successfully", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);

        const eq2 = jest.fn().mockResolvedValue({
            error: null,
        });

        const eq1 = jest.fn().mockReturnValue({
            eq: eq2,
        });

        const deleteFn = jest.fn().mockReturnValue({
            eq: eq1,
        });

        mockFrom.mockReturnValue({
            delete: deleteFn,
        });

        const result = await deleteFragment(fragment.fragment_id);

        expect(result).toEqual({
            data: null,
            error: null,
        });
    });

    it("returns error when delete fails", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);

        const eq2 = jest.fn().mockResolvedValue({
            error: new Error("DB Error"),
        });

        const eq1 = jest.fn().mockReturnValue({
            eq: eq2,
        });

        const deleteFn = jest.fn().mockReturnValue({
            eq: eq1,
        });

        mockFrom.mockReturnValue({
            delete: deleteFn,
        });

        const result = await deleteFragment(fragment.fragment_id);

        expect(result.error).toBe(
            "Ocurrió un error inesperado."
        );
    });
});

describe("get fragment counts", () => {
    it("returns fragment with counts", async () => {
        const single = jest.fn().mockResolvedValue({
            data: fragment,
            error: null,
        });

        const eq = jest.fn().mockReturnValue({
            single,
        });

        const select = jest.fn().mockReturnValue({
            eq,
        });

        mockFrom.mockReturnValue({
            select,
        });

        mockAttachCountsBatch.mockResolvedValue({
            postsMap: new Map(),
            fragmentsMap: new Map([
                [
                    fragment.fragment_id,
                    {
                        likes_count: 10,
                        comments_count: 5,
                        shares_count: 2,
                        liked_by_me: true,
                    },
                ],
            ]),
        });

        const result = await getFragmentWithCounts(
            fragment.fragment_id,
            currentUserId,
        );

        expect(result.data).toEqual({
            ...fragment,
            likes_count: 10,
            comments_count: 5,
            shares_count: 2,
            liked_by_me: true,
        });
    });

    it("returns default counts when fragment has no counts", async () => {
        const single = jest.fn().mockResolvedValue({
            data: fragment,
            error: null,
        });

        const eq = jest.fn().mockReturnValue({
            single,
        });

        const select = jest.fn().mockReturnValue({
            eq,
        });

        mockFrom.mockReturnValue({
            select,
        });

        mockAttachCountsBatch.mockResolvedValue({
            postsMap: new Map(),
            fragmentsMap: new Map(),
        });

        const result = await getFragmentWithCounts(
            fragment.fragment_id,
            currentUserId,
        );

        expect(result.data).toEqual({
            ...fragment,
            likes_count: 0,
            comments_count: 0,
            shares_count: 0,
            liked_by_me: false,
        });
    });
});

describe("get user fragments", () => {
    it("queries user fragments ordered by date", async () => {
        const order = jest.fn();

        const eq = jest.fn().mockReturnValue({
            order,
        });

        const select = jest.fn().mockReturnValue({
            eq,
        });

        mockFrom.mockReturnValue({
            select,
        });

        await getUserFragments(currentUserId);

        expect(mockFrom).toHaveBeenCalledWith(
            "fragments",
        );

        expect(eq).toHaveBeenCalledWith(
            "author_id",
            currentUserId,
        );

        expect(order).toHaveBeenCalledWith(
            "created_at",
            { ascending: false },
        );
    });
});