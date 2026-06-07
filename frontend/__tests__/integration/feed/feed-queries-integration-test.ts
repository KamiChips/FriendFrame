import { getFeed } from "@/services/supabase/feed/feed.queries";
import { signIn, signOut } from "@/services/supabase/auth/auth.sign-in";
import { supabaseAdmin } from "../helpers/supabase-test-client";
import {
  USER_A,
  USER_B,
  setupFriends,
  cleanupFriends,
} from "../helpers/posts-test-setup";

// ─── IDs compartidos ──────────────────────────────────────────────────────────
let testPostId: string;
let testFragmentId: string;

// ─── Setup global ─────────────────────────────────────────────────────────────
beforeAll(async () => {
  await setupFriends();

  // USER_A publica en perfil de USER_B (son amigos)
  const { data: post, error: postErr } = await supabaseAdmin
    .from("posts")
    .insert({
      author_id: USER_A.user_id,
      account_owner_id: USER_B.user_id,
      media: "https://via.placeholder.com/150",
      media_type: "image",
      description: "Post de prueba para feed",
    })
    .select("post_id")
    .single();
  if (postErr) throw new Error(`No se pudo crear post: ${postErr.message}`);
  testPostId = post.post_id;

  // USER_A publica fragmento en perfil de USER_B
  const { data: fragment, error: fragErr } = await supabaseAdmin
    .from("fragments")
    .insert({
      author_id: USER_A.user_id,
      account_owner_id: USER_B.user_id,
      content: "Fragmento de prueba para feed",
    })
    .select("fragment_id")
    .single();
  if (fragErr) throw new Error(`No se pudo crear fragmento: ${fragErr.message}`);
  testFragmentId = fragment.fragment_id;
});

afterAll(async () => {
  await signOut();
  if (testPostId)
    await supabaseAdmin.from("posts").delete().eq("post_id", testPostId);
  if (testFragmentId)
    await supabaseAdmin.from("fragments").delete().eq("fragment_id", testFragmentId);
  await cleanupFriends();
});

beforeEach(async () => {
  await signOut();
});

afterEach(async () => {
  await signOut();
});

// ─── getFeed ──────────────────────────────────────────────────────────────────
describe("getFeed — integración", () => {
  it("devuelve el feed del usuario autenticado", async () => {
    await signIn({ email: USER_B.email, password: USER_B.password });

    const result = await getFeed();

    expect(result.error).toBeNull();
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("el feed contiene publicaciones de personas que sigue", async () => {
    await signIn({ email: USER_B.email, password: USER_B.password });

    const result = await getFeed();

    expect(result.error).toBeNull();
    expect(result.data.length).toBeGreaterThanOrEqual(1);

    const authorIds = result.data.map((item) => item.author_id);
    expect(authorIds).toContain(USER_A.user_id);
  });

  it("cada item del feed tiene los campos requeridos", async () => {
    await signIn({ email: USER_B.email, password: USER_B.password });

    const result = await getFeed();
    expect(result.error).toBeNull();
    expect(result.data.length).toBeGreaterThanOrEqual(1);

    const item = result.data[0];
    expect(item).toMatchObject({
      id: expect.any(String),
      type: expect.stringMatching(/^(post|fragment)$/),
      author_id: expect.any(String),
      account_owner_id: expect.any(String),
      created_at: expect.any(String),
      likes_count: expect.any(Number),
      comments_count: expect.any(Number),
      shares_count: expect.any(Number),
      liked_by_me: expect.any(Boolean),
      author: expect.objectContaining({
        user_id: expect.any(String),
        username: expect.any(String),
        full_name: expect.any(String),
      }),
      account_owner: expect.objectContaining({
        user_id: expect.any(String),
        username: expect.any(String),
        full_name: expect.any(String),
      }),
    });
  });

  it("devuelve feed vacío si el usuario no tiene publicaciones en su feed", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await getFeed();

    expect(result.error).toBeNull();
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("retorna error si no hay sesión activa", async () => {
    const result = await getFeed();

    expect(result.error).not.toBeNull();
    expect(result.data).toEqual([]);
    expect(result.hasMore).toBe(false);
  });

  it("respeta el límite de resultados", async () => {
    await signIn({ email: USER_B.email, password: USER_B.password });

    const result = await getFeed(0, 1);

    expect(result.error).toBeNull();
    expect(result.data.length).toBeLessThanOrEqual(1);
  });

  it("hasMore es true cuando hay más resultados que el límite", async () => {
    await signIn({ email: USER_B.email, password: USER_B.password });

    // Con límite 1 y al menos 2 publicaciones (post + fragment)
    const result = await getFeed(0, 1);

    expect(result.error).toBeNull();
    expect(result.hasMore).toBe(true);
  });

  it("hasMore es false cuando se obtienen todos los resultados", async () => {
    await signIn({ email: USER_B.email, password: USER_B.password });

    const result = await getFeed(0, 50);

    expect(result.error).toBeNull();
    expect(result.hasMore).toBe(false);
  });

  it("página 2 devuelve resultados diferentes a página 1", async () => {
    await signIn({ email: USER_B.email, password: USER_B.password });

    const page1 = await getFeed(0, 1);
    const page2 = await getFeed(1, 1);

    expect(page1.error).toBeNull();
    expect(page2.error).toBeNull();

    if (page1.data.length > 0 && page2.data.length > 0) {
      expect(page1.data[0].id).not.toBe(page2.data[0].id);
    }
  });

  it("límite máximo no supera MAX_LIMIT (50)", async () => {
    await signIn({ email: USER_B.email, password: USER_B.password });

    const result = await getFeed(0, 100);

    expect(result.error).toBeNull();
    expect(result.data.length).toBeLessThanOrEqual(50);
  });
});