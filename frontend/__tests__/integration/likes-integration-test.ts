import {
  toggleLike,
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

// ─── Usuarios de prueba ────────────────────────────────────────────────────────
const TEST_USER_A = {
  email: process.env.TEST_USER_EMAIL!,
  password: process.env.TEST_USER_PASSWORD!,
  full_name: "Integration Likes A",
  username: "integration_likes_a",
};

const TEST_USER_B = {
  email: process.env.TEST_USER_B_EMAIL!,
  password: process.env.TEST_USER_B_PASSWORD!,
  full_name: "Integration Likes B",
  username: "integration_likes_b",
};

// ─── IDs compartidos ──────────────────────────────────────────────────────────
let testPostId: string;
let testFragmentId: string;
let userAId: string;
let userBId: string;

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function getSupabaseUserId(email: string): Promise<string | null> {
  const { data } = await supabaseAdmin.auth.admin.listUsers();
  return (
    data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id ??
    null
  );
}

async function cleanupUser(email: string) {
  await supabaseAdmin.from("users").delete().eq("email", email);
  const id = await getSupabaseUserId(email);
  if (id) await supabaseAdmin.auth.admin.deleteUser(id);
}

async function deleteAllLikes() {
  if (testPostId)
    await supabaseAdmin.from("likes").delete().eq("post_id", testPostId);
  if (testFragmentId)
    await supabaseAdmin.from("likes").delete().eq("fragment_id", testFragmentId);
}

// ─── Setup global ─────────────────────────────────────────────────────────────
beforeAll(async () => {
  await cleanupUser(TEST_USER_A.email);
  await cleanupUser(TEST_USER_B.email);

  const { data: authA, error: errA } = await supabaseAdmin.auth.admin.createUser({
    email: TEST_USER_A.email,
    password: TEST_USER_A.password,
    email_confirm: true,
    user_metadata: {
      full_name: TEST_USER_A.full_name,
      username: TEST_USER_A.username,
    },
  });
  if (errA) throw new Error(`No se pudo crear usuario A: ${errA.message}`);
  userAId = authA.user.id;

  const { data: authB, error: errB } = await supabaseAdmin.auth.admin.createUser({
    email: TEST_USER_B.email,
    password: TEST_USER_B.password,
    email_confirm: true,
    user_metadata: {
      full_name: TEST_USER_B.full_name,
      username: TEST_USER_B.username,
    },
  });
  if (errB) throw new Error(`No se pudo crear usuario B: ${errB.message}`);
  userBId = authB.user.id;

  // Crear post y fragment con admin para evitar restricciones de RLS
  const { data: post, error: postErr } = await supabaseAdmin
    .from("posts")
    .insert({ user_id: userAId, content: "Post de prueba para likes" })
    .select("post_id")
    .single();
  if (postErr) throw new Error(`No se pudo crear post: ${postErr.message}`);
  testPostId = post.post_id;

  const { data: fragment, error: fragErr } = await supabaseAdmin
    .from("fragments")
    .insert({ user_id: userAId, content: "Fragmento de prueba para likes" })
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

  await cleanupUser(TEST_USER_A.email);
  await cleanupUser(TEST_USER_B.email);
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
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });

    const result = await toggleLikePost(testPostId);

    expect(result.error).toBeNull();
    expect(result.data?.liked).toBe(true);
    expect(result.data?.count).toBeGreaterThanOrEqual(1);
  });

  it("quita el like a un post (segunda llamada, toggle)", async () => {
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });

    await toggleLikePost(testPostId); // dar like
    const result = await toggleLikePost(testPostId); // quitar like

    expect(result.error).toBeNull();
    expect(result.data?.liked).toBe(false);
    expect(result.data?.count).toBe(0);
  });

  it("da like a un fragmento correctamente", async () => {
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });

    const result = await toggleLikeFragment(testFragmentId);

    expect(result.error).toBeNull();
    expect(result.data?.liked).toBe(true);
  });

  it("quita el like a un fragmento (toggle)", async () => {
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });

    await toggleLikeFragment(testFragmentId);
    const result = await toggleLikeFragment(testFragmentId);

    expect(result.error).toBeNull();
    expect(result.data?.liked).toBe(false);
    expect(result.data?.count).toBe(0);
  });

  it("el conteo refleja likes de múltiples usuarios", async () => {
    // Usuario A da like
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });
    await toggleLikePost(testPostId);
    await signOut();

    // Usuario B da like
    await signIn({ email: TEST_USER_B.email, password: TEST_USER_B.password });
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
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });

    const result = await likePost(testPostId);

    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({
      post_id: testPostId,
      user_id: userAId,
    });
  });

  it("retorna error si se intenta dar like dos veces al mismo post", async () => {
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });

    await likePost(testPostId);
    const result = await likePost(testPostId); // duplicado

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });

  it("elimina el like de un post correctamente", async () => {
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });

    await likePost(testPostId);
    const result = await unlikePost(testPostId);

    expect(result.error).toBeNull();

    // Verificar que el like ya no existe
    const { data } = await supabaseAdmin
      .from("likes")
      .select("like_id")
      .eq("post_id", testPostId)
      .eq("user_id", userAId)
      .maybeSingle();
    expect(data).toBeNull();
  });

  it("unlikePost no lanza error si el like no existía", async () => {
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });

    const result = await unlikePost(testPostId);
    expect(result.error).toBeNull();
  });

  it("retorna error con postId inválido", async () => {
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });

    const result = await likePost("no-es-uuid");

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });
});

// ─── likeFragment / unlikeFragment ───────────────────────────────────────────
describe("likeFragment / unlikeFragment — integración", () => {
  it("inserta un like a un fragmento correctamente", async () => {
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });

    const result = await likeFragment(testFragmentId);

    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({
      fragment_id: testFragmentId,
      user_id: userAId,
    });
  });

  it("elimina el like de un fragmento correctamente", async () => {
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });

    await likeFragment(testFragmentId);
    const result = await unlikeFragment(testFragmentId);

    expect(result.error).toBeNull();

    const { data } = await supabaseAdmin
      .from("likes")
      .select("like_id")
      .eq("fragment_id", testFragmentId)
      .eq("user_id", userAId)
      .maybeSingle();
    expect(data).toBeNull();
  });

  it("retorna error con fragmentId inválido", async () => {
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });

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
    // A da like
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });
    await likePost(testPostId);
    await signOut();

    // B da like
    await signIn({ email: TEST_USER_B.email, password: TEST_USER_B.password });
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
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });
    await likeFragment(testFragmentId);
    await signOut();

    const result = await getLikers({ fragmentId: testFragmentId });

    expect(result.error).toBeNull();
    expect(result.data!.length).toBeGreaterThanOrEqual(1);
  });

  it("respeta el límite de resultados", async () => {
    // A y B dan like
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });
    await likePost(testPostId);
    await signOut();
    await signIn({ email: TEST_USER_B.email, password: TEST_USER_B.password });
    await likePost(testPostId);
    await signOut();

    const result = await getLikers({ postId: testPostId }, 1);

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
  });
});