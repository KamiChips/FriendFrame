import { getProfileFeed } from "@/services/supabase/posts/feed";
import { signIn, signOut } from "@/services/supabase/auth/auth.sign-in";
import { createPost } from "@/services/supabase/posts/posts";
import { createFragment } from "@/services/supabase/posts/fragment";
import { supabaseAdmin } from "../helpers/supabase-test-client";
import { setupFriends, cleanupFriends, USER_A, USER_B } from "../helpers/posts-test-setup";

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
    await supabaseAdmin.from("fragments")
        .delete()
        .in("author_id", [USER_A.user_id, USER_B.user_id]);
});

describe("getProfileFeed — integration", () => {

    // ─── validaciones ─────────────────────────────────────────────────────────
    it("returns error if profileOwnerId is invalid UUID", async () => {
        const result = await getProfileFeed("no-es-uuid", USER_A.user_id);
        expect(result.data).toBeNull();
        expect(result.error).toContain("ID de perfil");
    });

    it("returns error if currentUserId is invalid UUID", async () => {
        const result = await getProfileFeed(USER_B.user_id, "no-es-uuid");
        expect(result.data).toBeNull();
        expect(result.error).toContain("ID de usuario");
    });

    // ─── feed vacío ───────────────────────────────────────────────────────────
    it("returns empty array when profile has no posts or fragments", async () => {
        const result = await getProfileFeed(USER_B.user_id, USER_A.user_id);
        expect(result.error).toBeNull();
        expect(result.data).toEqual([]);
    });

    // ─── solo posts ───────────────────────────────────────────────────────────
    it("returns feed with only posts", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });

        await createPost(USER_B.user_id, "https://example.com/img.jpg", "image", "post 1");
        await createPost(USER_B.user_id, "https://example.com/img2.jpg", "image", "post 2");

        const result = await getProfileFeed(USER_B.user_id, USER_A.user_id);

        expect(result.error).toBeNull();
        expect(result.data?.length).toBeGreaterThanOrEqual(2);
        expect(result.data?.every(item => item.type === "post")).toBe(true);
    });

    // ─── solo fragments ───────────────────────────────────────────────────────
    it("returns feed with only fragments", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });

        await createFragment(USER_B.user_id, "fragment 1");
        await createFragment(USER_B.user_id, "fragment 2");

        const result = await getProfileFeed(USER_B.user_id, USER_A.user_id);

        expect(result.error).toBeNull();
        expect(result.data?.length).toBeGreaterThanOrEqual(2);
        expect(result.data?.every(item => item.type === "fragment")).toBe(true);
    });

    // ─── posts y fragments mezclados ──────────────────────────────────────────
    it("returns mixed feed sorted by date descending", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });

        await createPost(USER_B.user_id, "https://example.com/img.jpg", "image", "post");
        await createFragment(USER_B.user_id, "fragment");

        const result = await getProfileFeed(USER_B.user_id, USER_A.user_id);

        expect(result.error).toBeNull();
        expect(result.data?.length).toBeGreaterThanOrEqual(2);

        const types = result.data!.map(item => item.type);
        expect(types).toContain("post");
        expect(types).toContain("fragment");

        // verificar orden descendente
        for (let i = 0; i < result.data!.length - 1; i++) {
            const a = new Date(result.data![i].created_at).getTime();
            const b = new Date(result.data![i + 1].created_at).getTime();
            expect(a).toBeGreaterThanOrEqual(b);
        }
    });

    // ─── conteos ──────────────────────────────────────────────────────────────
    it("returns items with zero counts when no interactions", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });

        await createPost(USER_B.user_id, "https://example.com/img.jpg", "image", "nuevo");

        const result = await getProfileFeed(USER_B.user_id, USER_A.user_id);

        expect(result.error).toBeNull();
        const post = result.data?.find(item => item.type === "post");
        expect(post?.likes_count).toBe(0);
        expect(post?.comments_count).toBe(0);
        expect(post?.liked_by_me).toBe(false);
    });

    it("returns feed with fragment counts", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });

        await createFragment(USER_B.user_id, "fragment con conteos");

        const result = await getProfileFeed(USER_B.user_id, USER_A.user_id);

        expect(result.error).toBeNull();
        const fragment = result.data?.find(item => item.type === "fragment");
        expect(fragment).toBeDefined();
        expect(fragment?.likes_count).toBe(0);
        expect(fragment?.comments_count).toBe(0);
        expect(fragment?.liked_by_me).toBe(false);
    });

    it("returns mixed feed with both posts and fragments with counts", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });

        await createPost(USER_B.user_id, "https://example.com/img.jpg", "image", "post");
        await createFragment(USER_B.user_id, "fragment");

        const result = await getProfileFeed(USER_B.user_id, USER_A.user_id);

        expect(result.error).toBeNull();
        const post = result.data?.find(item => item.type === "post");
        const fragment = result.data?.find(item => item.type === "fragment");

        expect(post?.likes_count).toBe(0);
        expect(fragment?.likes_count).toBe(0);
    });

    // ─── paginación ───────────────────────────────────────────────────────────
    it("respects pagination params", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });

        // crear 3 posts
        await createPost(USER_B.user_id, "https://example.com/img1.jpg", "image", "post 1");
        await createPost(USER_B.user_id, "https://example.com/img2.jpg", "image", "post 2");
        await createPost(USER_B.user_id, "https://example.com/img3.jpg", "image", "post 3");

        const result = await getProfileFeed(USER_B.user_id, USER_A.user_id, { page: 0, limit: 2 });

        expect(result.error).toBeNull();
        // con limit 2 por tipo, máximo 4 items (2 posts + 2 fragments)
        // pero solo hay posts así que máximo 2
        expect(result.data?.length).toBeLessThanOrEqual(2);
    });

    it("returns second page correctly", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });

        await createPost(USER_B.user_id, "https://example.com/img1.jpg", "image", "post 1");
        await createPost(USER_B.user_id, "https://example.com/img2.jpg", "image", "post 2");
        await createPost(USER_B.user_id, "https://example.com/img3.jpg", "image", "post 3");

        const page1 = await getProfileFeed(USER_B.user_id, USER_A.user_id, { page: 0, limit: 2 });
        const page2 = await getProfileFeed(USER_B.user_id, USER_A.user_id, { page: 1, limit: 2 });

        expect(page1.error).toBeNull();
        expect(page2.error).toBeNull();

        // los ids no deben solaparse entre páginas
        const ids1 = page1.data!.map((item: any) => item.post_id ?? item.fragment_id);
        const ids2 = page2.data!.map((item: any) => item.post_id ?? item.fragment_id);
        const overlap = ids1.filter(id => ids2.includes(id));
        expect(overlap).toHaveLength(0);
    });

    it("returns items with default counts when not in countsMap", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });

        await createFragment(USER_B.user_id, "fragment sin conteos");

        const result = await getProfileFeed(USER_B.user_id, USER_A.user_id);

        expect(result.error).toBeNull();
        const fragment = result.data?.find(item => item.type === "fragment");
        expect(fragment?.likes_count).toBe(0);
        expect(fragment?.liked_by_me).toBe(false);
    });

    it("sorts mixed content correctly when fragment is newer than post", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });

        await createPost(USER_B.user_id, "https://example.com/img.jpg", "image", "post viejo");
        await new Promise(r => setTimeout(r, 100)); // pequeño delay para diferencia de timestamp
        await createFragment(USER_B.user_id, "fragment nuevo");

        const result = await getProfileFeed(USER_B.user_id, USER_A.user_id);

        expect(result.error).toBeNull();
        expect(result.data![0].type).toBe("fragment"); // fragment más reciente primero
        expect(result.data![1].type).toBe("post");
    });
});