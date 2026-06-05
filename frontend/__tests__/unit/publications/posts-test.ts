import { createPost, editPost, deletePost, getPostWithCounts, getUserPosts } from "@/services/supabase/posts/posts";
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

const currentUserId =
    "550e8400-e29b-41d4-a716-446655440000";

const profileOwnerId =
    "550e8400-e29b-41d4-a716-446655440001";

const postId =
    "550e8400-e29b-41d4-a716-446655440010";

beforeEach(() => {
    jest.clearAllMocks();
});

describe("createPost", () => {

    const mockPost = {
        post_id: "post-1",
        author_id: currentUserId,
        account_owner_id: profileOwnerId,
        media: "image.jpg",
        media_type: "image",
        description: "hola",
    };

    it("creates a post successfully", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);

        mockAssertFriendship.mockResolvedValue(undefined);

        const single = jest.fn().mockResolvedValue({
            data: mockPost,
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

        const result = await createPost(
            profileOwnerId,
            "image.jpg",
            "image",
            "hola",
        );

        expect(result).toEqual({
            data: mockPost,
            error: null,
        });

        expect(insert).toHaveBeenCalledWith({
            author_id: currentUserId,
            account_owner_id: profileOwnerId,
            media: "image.jpg",
            media_type: "image",
            description: "hola",
        });

        expect(notifyNewPublication).toHaveBeenCalled();
    });

    it("returns error if friendship validation fails", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);

        mockAssertFriendship.mockRejectedValue(
        new Error(
            "Solo puedes publicar en el perfil de tus amigos.",
        ),
        );

        const result = await createPost(
        profileOwnerId,
            "image.jpg",
            "image",
            "hola",
        );

        expect(result.error).toBe(
            "Solo puedes publicar en el perfil de tus amigos.",
        );
    });

    it("returns error if supabase insert fails", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);

        mockAssertFriendship.mockResolvedValue(undefined);

        const single = jest.fn().mockResolvedValue({
            data: null,
            error: new Error("DB Error"),
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

        const result = await createPost(
            profileOwnerId,
            "image.jpg",
            "image",
            "hola",
        );

        expect(result.error).toBe(
            "Ocurrió un error inesperado.",
        );
    });

    it("returns error if user is not authenticated", async () => {
        mockGetAuthUser.mockRejectedValue(
            new Error("No hay sesión activa.")
        );

        const result = await createPost(
            profileOwnerId,
            "image.jpg",
            "image",
            "hola",
        );

        expect(result).toEqual({
            data: null,
            error: "No hay sesión activa.",
        });

        expect(mockAssertFriendship).not.toHaveBeenCalled();
    });

    it("returns error if profileOwnerId is invalid", async () => {
        const result = await createPost(
            "id-invalido",
            "image.jpg",
            "image",
            "hola",
        );

        expect(result.data).toBeNull();

        expect(result.error).toContain("ID de perfil");
    });

    it("stores null description when description is empty", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);
        mockAssertFriendship.mockResolvedValue(undefined);

        const single = jest.fn().mockResolvedValue({
            data: mockPost,
            error: null,
        });

        const select = jest.fn().mockReturnValue({ single });

        const insert = jest.fn().mockReturnValue({ select });

        mockFrom.mockReturnValue({ insert });

        await createPost(
            profileOwnerId,
            "image.jpg",
            "image",
            "     ",
        );

        expect(insert).toHaveBeenCalledWith(
            expect.objectContaining({
                description: null,
            }),
        );
    });

    it("returns error when description exceeds max length", async () => {
        const description = "a".repeat(2001);

        const result = await createPost(
            profileOwnerId,
            "image.jpg",
            "image",
            description,
        );

        expect(result.error).toBe(
            "La descripción no puede superar 2000 caracteres."
        );
    });

    it("creates a post without description", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);
        mockAssertFriendship.mockResolvedValue(undefined);

        const single = jest.fn().mockResolvedValue({
            data: mockPost,
            error: null,
        });

        const select = jest.fn().mockReturnValue({ single });

        const insert = jest.fn().mockReturnValue({ select });

        mockFrom.mockReturnValue({ insert });

        await createPost(
            profileOwnerId,
            "image.jpg",
            "image",
        );

        expect(insert).toHaveBeenCalledWith(
            expect.objectContaining({
                description: null,
            }),
        );
    });
});

describe("edit post", () => {
    it("updates a post successfully", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);

        const updatedPost = {
            post_id: "post-1",
            description: "Nueva descripción",
        };

        const single = jest.fn().mockResolvedValue({
            data: updatedPost,
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

        const result = await editPost(
            "550e8400-e29b-41d4-a716-446655440010",
            "Nueva descripción",
        );

        expect(result).toEqual({
            data: updatedPost,
            error: null,
        });

        expect(update).toHaveBeenCalledWith({
            description: "Nueva descripción",
        });
    });

    it("returns error when post does not exist", async () => {
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

        const result = await editPost(
            "550e8400-e29b-41d4-a716-446655440010",
            "Nueva descripción",
        );

        expect(result.error).toBe(
            "Post no encontrado o sin permisos."
        );
    });

    it("returns error when update fails", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);

        const single = jest.fn().mockResolvedValue({
            data: null,
            error: new Error("DB Error"),
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

        const result = await editPost(
            "550e8400-e29b-41d4-a716-446655440010",
            "Nueva descripción",
        );

        expect(result.error).toBe(
            "Ocurrió un error inesperado."
        );
    });
});

describe("delete post", () => {
    it("deletes a post successfully", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);

        const single = jest.fn().mockResolvedValue({
            data: {
                media: "image.jpg",
            },
            error: null,
        });

        const fetchEq2 = jest.fn().mockReturnValue({
            single,
        });

        const fetchEq1 = jest.fn().mockReturnValue({
            eq: fetchEq2,
        });

        const select = jest.fn().mockReturnValue({
            eq: fetchEq1,
        });

        const deleteEq2 = jest.fn().mockResolvedValue({
            error: null,
        });

        const deleteEq1 = jest.fn().mockReturnValue({
            eq: deleteEq2,
        });

        const deleteFn = jest.fn().mockReturnValue({
            eq: deleteEq1,
        });

        mockFrom
            .mockReturnValueOnce({
                select,
            })
            .mockReturnValueOnce({
                delete: deleteFn,
            });

        const result = await deletePost(
            "550e8400-e29b-41d4-a716-446655440010",
        );

        expect(result).toEqual({
            data: null,
            error: null,
        });
    });

    it("returns error when post is not found", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);

        const single = jest.fn().mockResolvedValue({
            data: null,
            error: null,
        });

        const eq2 = jest.fn().mockReturnValue({
            single,
        });

        const eq1 = jest.fn().mockReturnValue({
            eq: eq2,
        });

        const select = jest.fn().mockReturnValue({
            eq: eq1,
        });

        mockFrom.mockReturnValue({
            select,
        });

        const result = await deletePost(
            "550e8400-e29b-41d4-a716-446655440010",
        );

        expect(result.error).toBe(
            "Post no encontrado o sin permisos para eliminarlo."
        );
    });

    it("returns error when delete query fails", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);

        const single = jest.fn().mockResolvedValue({
            data: {
                media: "image.jpg",
            },
            error: null,
        });

        const fetchEq2 = jest.fn().mockReturnValue({
            single,
        });

        const fetchEq1 = jest.fn().mockReturnValue({
            eq: fetchEq2,
        });

        const select = jest.fn().mockReturnValue({
            eq: fetchEq1,
        });

        const deleteEq2 = jest.fn().mockResolvedValue({
            error: new Error("DB Error"),
        });

        const deleteEq1 = jest.fn().mockReturnValue({
            eq: deleteEq2,
        });

        const deleteFn = jest.fn().mockReturnValue({
            eq: deleteEq1,
        });

        mockFrom
            .mockReturnValueOnce({
                select,
            })
            .mockReturnValueOnce({
                delete: deleteFn,
            });

        const result = await deletePost(
            "550e8400-e29b-41d4-a716-446655440010",
        );

        expect(result.error).toBe(
            "Ocurrió un error inesperado."
        );
    });
});

describe("get post with counts", () => {
    it("returns post with counts", async () => {
        const post = {
            post_id: "post-1",
            description: "hola",
        };

        const single = jest.fn().mockResolvedValue({
            data: post,
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
        postsMap: new Map([
            [
                "550e8400-e29b-41d4-a716-446655440010", // ← este, no "post-1"
                {
                    likes_count: 10,
                    comments_count: 5,
                    shares_count: 1,
                    liked_by_me: true,
                },
            ],
        ]),
});

        const result = await getPostWithCounts(
            "550e8400-e29b-41d4-a716-446655440010",
            currentUserId,
        );

        expect(result.data).toEqual({
            ...post,
            likes_count: 10,
            comments_count: 5,
            shares_count: 1,
            liked_by_me: true,
        });
    });

    it("returns default counts when post has no counts", async () => {
        const post = {
            post_id: "post-1",
        };

        const single = jest.fn().mockResolvedValue({
            data: post,
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

        (attachCountsBatch as jest.Mock).mockResolvedValue({
            postsMap: new Map(),
        });

        const result = await getPostWithCounts(
            "550e8400-e29b-41d4-a716-446655440010",
            currentUserId,
        );

        expect(result.data).toEqual({
            ...post,
            likes_count: 0,
            comments_count: 0,
            shares_count: 0,
            liked_by_me: false,
        });
    });
});

describe("get user posts", () => {
    it("queries user posts ordered by date", async () => {
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

        await getUserPosts(currentUserId);

        expect(mockFrom).toHaveBeenCalledWith("posts");

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