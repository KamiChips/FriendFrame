import { createPost, editPost, deletePost, getPostWithCounts, getUserPosts } from "@/services/supabase/posts/posts";
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
const postId = "550e8400-e29b-41d4-a716-446655440010";

const mockPost = {
    post_id: postId,
    author_id: currentUserId,
    account_owner_id: profileOwnerId,
    media: "imagenbienepica.jpg",
    media_type: "image",
    description: "hola",
};

// helpers para que esta cosa no tenga 500 lineas
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

const selectSingleEqChain = (data: any, error: any = null) => ({
    select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({ single: single(data, error) }),
    }),
});

const selectDoubleEqChain = (data: any, error: any = null) => ({
    select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({ single: single(data, error) }),
        }),
    }),
});

const makeDeleteMocks = (deleteError: any = null) => {
    const deleteFn = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: deleteError }),
        }),
    });
    mockFrom
        .mockReturnValueOnce(selectDoubleEqChain({ media: "image.jpg" }))
        .mockReturnValueOnce({ delete: deleteFn });
};

beforeEach(() => {
    jest.clearAllMocks();
    mockGetAuthUser.mockResolvedValue(currentUserId);
    mockAssertFriendship.mockResolvedValue(undefined);
});

describe("createPost", () => {
    it("creates a post successfully", async () => {
        mockFrom.mockReturnValue(insertChain(mockPost));

        const result = await createPost(profileOwnerId, "image.jpg", "image", "hola");

        expect(result).toEqual({ data: mockPost, error: null });
        expect(notifyNewPublication).toHaveBeenCalled();
    });

    it("stores null description when description is empty", async () => {
        const insert = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({ single: single(mockPost) }),
        });
        mockFrom.mockReturnValue({ insert });

        await createPost(profileOwnerId, "image.jpg", "image", "     ");
        expect(insert).toHaveBeenCalledWith(expect.objectContaining({ description: null }));
    });

    it("creates a post without description", async () => {
        const insert = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({ single: single(mockPost) }),
        });
        mockFrom.mockReturnValue({ insert });

        await createPost(profileOwnerId, "image.jpg", "image");
        expect(insert).toHaveBeenCalledWith(expect.objectContaining({ description: null }));
    });

    it("returns error if description exceeds max length", async () => {
        const result = await createPost(profileOwnerId, "image.jpg", "image", "a".repeat(2001));
        expect(result.error).toBe("La descripción no puede superar 2000 caracteres.");
    });

    it("returns error if profileOwnerId is invalid", async () => {
        const result = await createPost("id-invalido", "image.jpg", "image", "hola");
        expect(result.data).toBeNull();
        expect(result.error).toContain("ID de perfil");
    });

    it("returns error if user is not authenticated", async () => {
        mockGetAuthUser.mockRejectedValue(new Error("No hay sesión activa."));

        const result = await createPost(profileOwnerId, "image.jpg", "image", "hola");
        expect(result).toEqual({ data: null, error: "No hay sesión activa." });
        expect(mockAssertFriendship).not.toHaveBeenCalled();
    });

    it("returns error if friendship validation fails", async () => {
        mockAssertFriendship.mockRejectedValue(new Error("Solo puedes publicar en el perfil de tus amigos."));

        const result = await createPost(profileOwnerId, "image.jpg", "image", "hola");
        expect(result.error).toBe("Solo puedes publicar en el perfil de tus amigos.");
    });

    it("returns error if supabase insert fails", async () => {
        mockFrom.mockReturnValue(insertChain(null, new Error("DB Error")));

        const result = await createPost(profileOwnerId, "image.jpg", "image", "hola");
        expect(result.error).toBe("Ocurrió un error inesperado.");
    });
});

describe("editPost", () => {
    it("updates a post successfully", async () => {
        mockFrom.mockReturnValue(updateChain({ post_id: postId, description: "Nueva descripción" }));

        const result = await editPost(postId, "Nueva descripción");
        expect(result.data).toEqual({ post_id: postId, description: "Nueva descripción" });
        expect(result.error).toBeNull();
    });

    it("returns error when post does not exist", async () => {
        mockFrom.mockReturnValue(updateChain(null));

        const result = await editPost(postId, "Nueva descripción");
        expect(result.error).toBe("Post no encontrado o sin permisos.");
    });

    it("returns error when update fails", async () => {
        mockFrom.mockReturnValue(updateChain(null, new Error("DB Error")));

        const result = await editPost(postId, "Nueva descripción");
        expect(result.error).toBe("Ocurrió un error inesperado.");
    });
});

describe("deletePost", () => {
    it("deletes a post successfully", async () => {
        makeDeleteMocks();
        const result = await deletePost(postId);
        expect(result).toEqual({ data: null, error: null });
    });

    it("returns error when post is not found", async () => {
        mockFrom.mockReturnValue(selectDoubleEqChain(null));
        const result = await deletePost(postId);
        expect(result.error).toBe("Post no encontrado o sin permisos para eliminarlo.");
    });

    it("returns error when delete query fails", async () => {
        makeDeleteMocks(new Error("DB Error"));
        const result = await deletePost(postId);
        expect(result.error).toBe("Ocurrió un error inesperado.");
    });
});

describe("getPostWithCounts", () => {
    const post = { post_id: postId, description: "hola" };

    beforeEach(() => {
        mockFrom.mockReturnValue(selectSingleEqChain(post));
    });

    it("returns post with counts", async () => {
        mockAttachCountsBatch.mockResolvedValue({
            postsMap: new Map([[postId, { likes_count: 10, comments_count: 5, shares_count: 1, liked_by_me: true }]]),
        });

        const result = await getPostWithCounts(postId, currentUserId);
        expect(result.data).toEqual({ ...post, likes_count: 10, comments_count: 5, shares_count: 1, liked_by_me: true });
    });

    it("returns default counts when post has no counts", async () => {
        mockAttachCountsBatch.mockResolvedValue({ postsMap: new Map() });

        const result = await getPostWithCounts(postId, currentUserId);
        expect(result.data).toEqual({ ...post, likes_count: 0, comments_count: 0, shares_count: 0, liked_by_me: false });
    });
});

describe("getUserPosts", () => {
    it("queries user posts ordered by date", async () => {
        const order = jest.fn();
        const eq = jest.fn().mockReturnValue({ order });
        const select = jest.fn().mockReturnValue({ eq });
        mockFrom.mockReturnValue({ select });

        await getUserPosts(currentUserId);

        expect(mockFrom).toHaveBeenCalledWith("posts");
        expect(eq).toHaveBeenCalledWith("author_id", currentUserId);
        expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
    });
});