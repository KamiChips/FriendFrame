import { signIn, signOut } from "@/services/supabase/auth/auth.sign-in";
import {
    assertFriendship, attachCountsBatch,
    notifyNewPublication, deleteMediaFile,
} from "@/services/supabase/posts/helpers";
import { supabaseAdmin } from "../helpers/supabase-test-client";
import { setupFriends, cleanupFriends, USER_A, USER_B } from "../helpers/posts-test-setup";
import { createBuckets } from "../helpers/storage-setup";

beforeAll(async () => {
    await setupFriends();
    await createBuckets();
});

afterAll(async () => {
    await cleanupFriends();
});

afterEach(async () => {
    await signOut();
});

describe("assertFriendship (integration)", () => {
    it("throws when author and owner are the same", async () => {
        await expect(assertFriendship(USER_A.user_id, USER_A.user_id))
            .rejects.toThrow("No puedes publicar en tu propio perfil.");
    });

    it("resolves when users are friends", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });
        await expect(assertFriendship(USER_A.user_id, USER_B.user_id)).resolves.toBeUndefined();
    });

    it("throws when users are not friends", async () => {
    const { data: { user: userC } } = await supabaseAdmin.auth.admin.createUser({
        email: "userc-helpers@test.com",
        password: "password123",
        email_confirm: true,
        user_metadata: { full_name: "User C", username: "userc_helpers_test" },
    });
    if (!userC) throw new Error("No se pudo crear usuario C");

    await supabaseAdmin.from("users").insert({
        user_id: userC.id, full_name: "User C",
        username: "userc_helpers_test", email: "userc-helpers@test.com",
    });

    await expect(assertFriendship(USER_A.user_id, userC.id))
        .rejects.toThrow("Solo puedes publicar en el perfil de tus amigos.");

    await supabaseAdmin.from("users").delete().eq("user_id", userC.id);
    await supabaseAdmin.auth.admin.deleteUser(userC.id);
});
});

describe("attachCountsBatch (integration)", () => {
    it("returns empty maps when no posts or fragments", async () => {
        const result = await attachCountsBatch([], [], USER_A.user_id);
        expect(result.postsMap.size).toBe(0);
        expect(result.fragmentsMap.size).toBe(0);
    });

    it("returns counts for existing posts", async () => {
        const { data: post } = await supabaseAdmin.from("posts").insert({
            author_id: USER_A.user_id,
            account_owner_id: USER_B.user_id,
            media: "https://example.com/img.jpg",
            media_type: "image",
        }).select().single();

        const result = await attachCountsBatch([post as any], [], USER_A.user_id);

        expect(result.postsMap.has(post!.post_id)).toBe(true);
        expect(result.postsMap.get(post!.post_id)?.likes_count).toBe(0);

        await supabaseAdmin.from("posts").delete().eq("post_id", post!.post_id);
    });

    it("returns counts for existing fragments", async () => {
        const { data: fragment } = await supabaseAdmin.from("fragments").insert({
            author_id: USER_A.user_id,
            account_owner_id: USER_B.user_id,
            content: "test fragment",
        }).select().single();

        const result = await attachCountsBatch([], [fragment as any], USER_A.user_id);

        expect(result.fragmentsMap.has(fragment!.fragment_id)).toBe(true);
        expect(result.fragmentsMap.get(fragment!.fragment_id)?.likes_count).toBe(0);

        await supabaseAdmin.from("fragments").delete().eq("fragment_id", fragment!.fragment_id);
    });
});

describe("notifyNewPublication (integration)", () => {
    it("inserts notification for new_post without throwing", async () => {
        notifyNewPublication(USER_B.user_id, USER_A.user_id, "new_post", "550e8400-e29b-41d4-a716-446655440099");
        await new Promise(r => setTimeout(r, 200));
    });

    it("inserts notification for new_fragment without throwing", async () => {
        notifyNewPublication(USER_B.user_id, USER_A.user_id, "new_fragment", "550e8400-e29b-41d4-a716-446655440099");
        await new Promise(r => setTimeout(r, 200));
    });
});

describe("deleteMediaFile (integration)", () => {
    it("silently ignores url with no post-images marker", async () => {
        await expect(
            deleteMediaFile("https://cdn.example.com/other/file.jpg")
        ).resolves.toBeUndefined();
    });

    it("silently ignores errors when file does not exist", async () => {
        const url = "http://127.0.0.1:54321/storage/v1/object/public/post-images/nonexistent/file.jpg";
        await expect(deleteMediaFile(url)).resolves.toBeUndefined();
    });

    it("deletes existing file silently", async () => {
        // subir archivo real para luego borrarlo
        const buffer = Buffer.from("fake-image");
        await supabaseAdmin.storage
            .from("post-images")
            .upload(`${USER_A.user_id}/delete-test.jpg`, buffer, { contentType: "image/jpeg", upsert: true });

        const { data } = supabaseAdmin.storage
            .from("post-images")
            .getPublicUrl(`${USER_A.user_id}/delete-test.jpg`);

        await expect(deleteMediaFile(data.publicUrl)).resolves.toBeUndefined();
    });
});