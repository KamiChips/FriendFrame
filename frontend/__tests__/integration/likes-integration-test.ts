import {
  toggleLikePost,
  toggleLikeFragment,
  likePost,
  unlikePost,
  likeFragment,
  unlikeFragment,
  getLikers,
} from "@/services/supabase/interactions/likes";
import { signIn, signOut } from "@/services/supabase/auth/auth.sign-in";
import { supabaseAdmin } from "./helpers/supabase-test-client";
import {
  USER_A,
  USER_B,
  setupFriends,
  cleanupFriends,
} from "./helpers/posts-test-setup";

// ─── IDs compartidos ──────────────────────────────────────────────────────────
let testPostId: string;
let testFragmentId: string;

async function deleteAllLikes() {
  if (testPostId)
    await supabaseAdmin.from("likes").delete().eq("post_id", testPostId);
  if (testFragmentId)
    await supabaseAdmin.from("likes").delete().eq("fragment_id", testFragmentId);
}

// ─── Setup global ─────────────────────────────────────────────────────────────
beforeAll(async () => {
  await setupFriends();

  const { data: post, error: postErr } = await supabaseAdmin
    .from("posts")
    .insert({
      author_id: USER_A.user_id,
      account_owner_id: USER_B.user_id,
      description: "Post de prueba para likes",
      media: "https://via.placeholder.com/150",
    })
    .select("post_id")
    .single();
  if (postErr) throw new Error(`No se pudo crear post: ${postErr.message}`);
  testPostId = post.post_id;

  const { data: fragment, error: fragErr } = await supabaseAdmin
    .from("fragments")
    .insert({
      author_id: USER_A.user_id,
      account_owner_id: USER_B.user_id,
      content: "Fragmento de prueba para likes",
    })
    .select("fragment_id")
    .single();
  if (fragErr) throw new Error(`No se pudo crear fragmento: ${fragErr.message}`);
  testFragmentId = fragment.fragment_id;
});

afterAll(async () => {
  await signOut();
  await deleteAllLikes();
  if (testPostId)
    await supabaseAdmin.from("posts").delete().eq("post_id", testPostId);
  if (testFragmentId)
    await supabaseAdmin.from("fragments").delete().eq("fragment_id", testFragmentId);
  await cleanupFriends();
});

beforeEach(async () => {
  await signOut();
  await deleteAllLikes();
});

afterEach(async () => {
  await signOut();
});

// ─── toggleLike ───────────────────────────────────────────────────────────────
describe("toggleLike — integración", () => {
  it("da like a un post (primera llamada)", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await toggleLikePost(testPostId);

    expect(result.error).toBeNull();
    expect(result.data?.liked).toBe(true);
    expect(result.data?.count).toBeGreaterThanOrEqual(1);
  });

  it("quita el like a un post (segunda llamada, toggle)", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    await toggleLikePost(testPostId);
    const result = await toggleLikePost(testPostId);

    expect(result.error).toBeNull();
    expect(result.data?.liked).toBe(false);
    expect(result.data?.count).toBe(0);
  });

  it("da like a un fragmento correctamente", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await toggleLikeFragment(testFragmentId);

    expect(result.error).toBeNull();
    expect(result.data?.liked).toBe(true);
  });

  it("quita el like a un fragmento (toggle)", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    await toggleLikeFragment(testFragmentId);
    const result = await toggleLikeFragment(testFragmentId);

    expect(result.error).toBeNull();
    expect(result.data?.liked).toBe(false);
    expect(result.data?.count).toBe(0);
  });

  it("el conteo refleja likes de múltiples usuarios", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });
    await toggleLikePost(testPostId);
    await signOut();

    await signIn({ email: USER_B.email, password: USER_B.password });
    const result = await toggleLikePost(testPostId);

    expect(result.error).toBeNull();
    expect(result.data?.count).toBeGreaterThanOrEqual(2);
  });

  it("retorna error si no hay sesión activa", async () => {
    const result = await toggleLikePost(testPostId);

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });
});

// ─── likePost / unlikePost ────────────────────────────────────────────────────
describe("likePost / unlikePost — integración", () => {
  it("inserta un like a un post correctamente", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await likePost(testPostId);

    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({
      post_id: testPostId,
      user_id: USER_A.user_id,
    });
  });

  it("retorna error si se intenta dar like dos veces al mismo post", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    await likePost(testPostId);
    const result = await likePost(testPostId);

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });

  it("elimina el like de un post correctamente", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    await likePost(testPostId);
    const result = await unlikePost(testPostId);

    expect(result.error).toBeNull();

    const { data } = await supabaseAdmin
      .from("likes")
      .select("like_id")
      .eq("post_id", testPostId)
      .eq("user_id", USER_A.user_id)
      .maybeSingle();
    expect(data).toBeNull();
  });

  it("unlikePost no lanza error si el like no existía", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await unlikePost(testPostId);
    expect(result.error).toBeNull();
  });

  it("retorna error con postId inválido", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await likePost("no-es-uuid");

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });
});

// ─── likeFragment / unlikeFragment ───────────────────────────────────────────
describe("likeFragment / unlikeFragment — integración", () => {
  it("inserta un like a un fragmento correctamente", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await likeFragment(testFragmentId);

    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({
      fragment_id: testFragmentId,
      user_id: USER_A.user_id,
    });
  });

  it("elimina el like de un fragmento correctamente", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    await likeFragment(testFragmentId);
    const result = await unlikeFragment(testFragmentId);

    expect(result.error).toBeNull();

    const { data } = await supabaseAdmin
      .from("likes")
      .select("like_id")
      .eq("fragment_id", testFragmentId)
      .eq("user_id", USER_A.user_id)
      .maybeSingle();
    expect(data).toBeNull();
  });

  it("retorna error con fragmentId inválido", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await likeFragment("no-es-uuid");

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });
});

// ─── getLikers ────────────────────────────────────────────────────────────────
describe("getLikers — integración", () => {
  it("devuelve lista vacía si nadie ha dado like", async () => {
    const result = await getLikers({ postId: testPostId });

    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });

  it("devuelve los usuarios que dieron like a un post", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });
    await likePost(testPostId);
    await signOut();

    await signIn({ email: USER_B.email, password: USER_B.password });
    await likePost(testPostId);
    await signOut();

    const result = await getLikers({ postId: testPostId });

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);
    result.data!.forEach((user) => {
      expect(user).toMatchObject({
        user_id: expect.any(String),
        username: expect.any(String),
        full_name: expect.any(String),
      });
      expect(user).toHaveProperty("profile_pic");
    });
  });

  it("devuelve los usuarios que dieron like a un fragmento", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });
    await likeFragment(testFragmentId);
    await signOut();

    const result = await getLikers({ fragmentId: testFragmentId });

    expect(result.error).toBeNull();
    expect(result.data!.length).toBeGreaterThanOrEqual(1);
  });

  it("respeta el límite de resultados", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });
    await likePost(testPostId);
    await signOut();

    await signIn({ email: USER_B.email, password: USER_B.password });
    await likePost(testPostId);
    await signOut();

    const result = await getLikers({ postId: testPostId }, 1);

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
  });
});