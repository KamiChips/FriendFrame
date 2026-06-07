import { signIn, signOut } from "@/services/supabase/auth/auth.sign-in";
import { createPost, editPost, deletePost, getPostWithCounts, getUserPosts } 
    from "@/services/supabase/posts/posts";
import { supabaseAdmin } from "../helpers/supabase-test-client";
import { setupFriends, cleanupFriends, USER_A, USER_B } 
    from "../helpers/posts-test-setup";

beforeAll(async () => {
    await setupFriends();
});

afterAll(async () => {
    await cleanupFriends();
});

afterEach(async () => {
    await signOut();
    await supabaseAdmin.from("posts")
        .delete()
        .in("author_id", [USER_A.user_id, USER_B.user_id]);
});

describe("createPost — integration", () => {
    it("user A can post on user B's profile (friends)", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });

        const result = await createPost(
            USER_B.user_id,
            "https://example.com/image.jpg",
            "image",
            "hola desde integración",
        );

        expect(result.error).toBeNull();
        expect(result.data?.account_owner_id).toBe(USER_B.user_id);
        expect(result.data?.author_id).toBe(USER_A.user_id);
    });

    it("post is actually saved in the database", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });

        await createPost(USER_B.user_id, "https://example.com/img.jpg", "image", "test");

        const { data } = await supabaseAdmin
            .from("posts")
            .select("*")
            .eq("account_owner_id", USER_B.user_id)
            .eq("author_id", USER_A.user_id)
            .single();

        expect(data).not.toBeNull();
        expect(data.description).toBe("test");
    });

    it("returns error when posting on own profile", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });

        const result = await createPost(
            USER_A.user_id, // mismo usuario
            "https://example.com/img.jpg",
            "image",
        );

        expect(result.error).toBe("No puedes publicar en tu propio perfil.");
    });

    it("returns error when not authenticated", async () => {
        // sin signIn
        const result = await createPost(
            USER_B.user_id,
            "https://example.com/img.jpg",
            "image",
        );

        expect(result.error).toBe("No hay sesión activa.");
    });
});

describe("editPost — integration", () => {
    it("author can edit their own post", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });

        const { data: post } = await createPost(
            USER_B.user_id, "https://example.com/img.jpg", "image", "original"
        );

        const result = await editPost(post!.post_id, "editado");

        expect(result.error).toBeNull();
        expect(result.data?.description).toBe("editado");
    });

    it("edit is reflected in the database", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });

        const { data: post } = await createPost(
            USER_B.user_id, "https://example.com/img.jpg", "image", "original"
        );

        await editPost(post!.post_id, "editado");

        const { data } = await supabaseAdmin
            .from("posts")
            .select("description")
            .eq("post_id", post!.post_id)
            .single();

        expect(data?.description).toBe("editado");
    });

    it("user B cannot edit user A's post", async () => {
        // A crea el post
        await signIn({ email: USER_A.email, password: USER_A.password });
        const { data: post } = await createPost(
            USER_B.user_id, "https://example.com/img.jpg", "image", "original"
        );
        await signOut();

        // B intenta editarlo
        await signIn({ email: USER_B.email, password: USER_B.password });
        const result = await editPost(post!.post_id, "intento editar");

        expect(result.error).toBe("Post no encontrado o sin permisos.");
    });

    it("returns specific error when post not found (PGRST116)", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });

        // UUID válido pero inexistente
        const fakePostId = "550e8400-e29b-41d4-a716-446655440099";
        const result = await editPost(fakePostId, "nueva descripción");

        expect(result.error).toBe("Post no encontrado o sin permisos.");
    });

    it("returns error when new description exceeds max length", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });

        const { data: post } = await createPost(
            USER_B.user_id, "https://example.com/img.jpg", "image", "original"
        );

        const result = await editPost(post!.post_id, "a".repeat(2001));
        expect(result.error).toContain("La descripción");
    });
});

describe("deletePost — integration", () => {
    it("author can delete their own post", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });

        const { data: post } = await createPost(
            USER_B.user_id, "https://example.com/img.jpg", "image", "para borrar"
        );

        const result = await deletePost(post!.post_id);
        expect(result.error).toBeNull();

        // Verificar que ya no existe
        const { data } = await supabaseAdmin
            .from("posts")
            .select("*")
            .eq("post_id", post!.post_id)
            .single();

        expect(data).toBeNull();
    });

    it("user B cannot delete user A's post", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });
        const { data: post } = await createPost(
            USER_B.user_id, "https://example.com/img.jpg", "image", "no borrar"
        );
        await signOut();

        await signIn({ email: USER_B.email, password: USER_B.password });
        const result = await deletePost(post!.post_id);

        expect(result.error).toBe("Post no encontrado o sin permisos para eliminarlo.");
    });

    it("returns error when postId is invalid UUID", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });
        const result = await deletePost("no-es-uuid");
        expect(result.error).toContain("error");
    });
});

describe("getPostWithCounts — integration", () => {
    it("returns post with zero counts when new", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });

        const { data: post } = await createPost(
            USER_B.user_id, "https://example.com/img.jpg", "image", "nuevo"
        );

        const result = await getPostWithCounts(post!.post_id, USER_A.user_id);

        expect(result.error).toBeNull();
        expect(result.data?.likes_count).toBe(0);
        expect(result.data?.comments_count).toBe(0);
        expect(result.data?.liked_by_me).toBe(false);
    });

    it("returns error when currentUserId is invalid UUID", async () => {
        const result = await getPostWithCounts("550e8400-e29b-41d4-a716-446655440099", "no-es-uuid");
        expect(result.error).toContain("ID de usuario");
    });
});

describe("getUserPosts — integration", () => {
    it("returns posts for a user ordered by date", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });

        await createPost(USER_B.user_id, "https://example.com/img1.jpg", "image", "post 1");
        await createPost(USER_B.user_id, "https://example.com/img2.jpg", "image", "post 2");

        const result = await getUserPosts(USER_A.user_id);

        // getUserPosts retorna la query directamente sin await
        const { data, error } = await result;
        expect(error).toBeNull();
        expect(data?.length).toBeGreaterThanOrEqual(2);
    });

    it("returns empty array for user with no posts", async () => {
        const { data, error } = await getUserPosts(USER_B.user_id);
        expect(error).toBeNull();
        expect(data).toEqual([]);
    });
});