import { signIn, signOut } from "@/services/supabase/auth/auth.sign-in";
import {
  getProfile,
  getProfileStats,
  getMyProfile,
  searchUsers,
} from "@/services/supabase/profile/queries";
import { supabaseAdmin } from "../helpers/supabase-test-client";
import {
  USER_A,
  USER_B,
  setupFriends,
  cleanupFriends,
} from "../helpers/posts-test-setup";

async function clearSocialData() {
  const ids = [USER_A.user_id, USER_B.user_id].filter(Boolean);
  if (ids.length === 0) return;
  await supabaseAdmin.from("follows").delete().in("follower_id", ids);
  await supabaseAdmin.from("blocks").delete().in("blocker_id", ids);
}

beforeAll(async () => {
  await setupFriends();
});

afterAll(async () => {
  await signOut();
  await cleanupFriends();
});

beforeEach(async () => {
  await signOut();
  await clearSocialData();
});

afterEach(async () => {
  await signOut();
});

describe("getProfile — integración", () => {
  it("retorna el perfil de B con estadísticas y relación", async () => {
    await supabaseAdmin.from("follows").insert({
      follower_id: USER_A.user_id,
      following_id: USER_B.user_id,
    });

    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await getProfile(USER_B.user_id, USER_A.user_id);

    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({
      user_id: USER_B.user_id,
      username: "integration_user_b",
      i_follow_them: true,
      is_following_me: false,
      is_friend: false,
      is_blocked: false,
      blocked_me: false,
    });
    expect(result.data?.stats).toMatchObject({
      followers_count: expect.any(Number),
      following_count: expect.any(Number),
      friends_count: expect.any(Number),
      posts_count: expect.any(Number),
      fragments_count: expect.any(Number),
      publications_count: expect.any(Number),
    });
  });

  it("is_friend es true cuando el follow es mutuo", async () => {
    await supabaseAdmin.from("follows").insert([
      { follower_id: USER_A.user_id, following_id: USER_B.user_id },
      { follower_id: USER_B.user_id, following_id: USER_A.user_id },
    ]);

    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await getProfile(USER_B.user_id, USER_A.user_id);

    expect(result.error).toBeNull();
    expect(result.data?.is_friend).toBe(true);
  });

  it("is_blocked es true cuando A ha bloqueado a B", async () => {
    await supabaseAdmin.from("blocks").insert({
      blocker_id: USER_A.user_id,
      blocked_id: USER_B.user_id,
    });

    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await getProfile(USER_B.user_id, USER_A.user_id);

    expect(result.error).toBeNull();
    expect(result.data?.is_blocked).toBe(true);
  });

  it("retorna error con UUID inválido", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await getProfile("no-es-uuid", USER_A.user_id);

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });

  it("retorna error si el usuario objetivo no existe", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await getProfile(
      "00000000-0000-0000-0000-000000000000",
      USER_A.user_id,
    );

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });
});

describe("getProfileStats — integración", () => {
  it("retorna las estadísticas del perfil de B", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await getProfileStats(USER_B.user_id);

    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({
      followers_count: expect.any(Number),
      following_count: expect.any(Number),
      friends_count: expect.any(Number),
      posts_count: expect.any(Number),
      fragments_count: expect.any(Number),
      publications_count: expect.any(Number),
    });
  });

  it("retorna error con UUID inválido", async () => {
    const result = await getProfileStats("no-es-uuid");

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });
});

describe("getMyProfile — integración", () => {
  it("retorna el perfil propio con estadísticas", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await getMyProfile();

    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({
      user_id: USER_A.user_id,
      username: "integration_user_a",
    });
    expect(result.data?.stats).toMatchObject({
      followers_count: expect.any(Number),
      following_count: expect.any(Number),
      friends_count: expect.any(Number),
      posts_count: expect.any(Number),
      fragments_count: expect.any(Number),
      publications_count: expect.any(Number),
    });
  });

  it("retorna error si no hay sesión activa", async () => {
    const result = await getMyProfile();

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });
});

describe("searchUsers — integración", () => {
  it("encuentra a B buscando por su username", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await searchUsers("integration_user_b", USER_A.user_id);

    expect(result.error).toBeNull();
    expect(result.data?.some((u) => u.user_id === USER_B.user_id)).toBe(true);
  });

  it("retorna lista vacía si la búsqueda es muy corta", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await searchUsers("a", USER_A.user_id);

    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });

  it("retorna error si la búsqueda excede el largo máximo", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await searchUsers("a".repeat(51), USER_A.user_id);

    expect(result.error).toBe("La búsqueda no puede superar 50 caracteres.");
  });

  it("no incluye usuarios bloqueados en los resultados", async () => {
    await supabaseAdmin.from("blocks").insert({
      blocker_id: USER_A.user_id,
      blocked_id: USER_B.user_id,
    });

    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await searchUsers("integration_user_b", USER_A.user_id);

    expect(result.error).toBeNull();
    expect(result.data?.some((u) => u.user_id === USER_B.user_id)).toBe(false);
  });

  it("retorna error con UUID inválido", async () => {
    const result = await searchUsers("integration_user_b", "no-es-uuid");

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });
});
