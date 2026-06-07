import { signIn, signOut } from "@/services/supabase/auth/auth.sign-in";
import {
  getFollowers,
  getFollowing,
  getFriends,
} from "@/services/supabase/profile/social";
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

describe("getFollowers — integración", () => {
  it("retorna los seguidores de B incluyendo a A", async () => {
    await supabaseAdmin.from("follows").insert({
      follower_id: USER_A.user_id,
      following_id: USER_B.user_id,
    });

    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await getFollowers(USER_B.user_id, USER_A.user_id);

    expect(result.error).toBeNull();
    expect(result.data?.some((u) => u.user_id === USER_A.user_id)).toBe(true);
  });

  it("respeta los parámetros de paginación", async () => {
    await supabaseAdmin.from("follows").insert({
      follower_id: USER_A.user_id,
      following_id: USER_B.user_id,
    });

    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await getFollowers(USER_B.user_id, USER_A.user_id, {
      page: 0,
      limit: 1,
    });

    expect(result.error).toBeNull();
    expect(result.data?.length).toBeLessThanOrEqual(1);
  });

  it("retorna error con UUID inválido", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await getFollowers("no-es-uuid", USER_A.user_id);

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });
});

describe("getFollowing — integración", () => {
  it("retorna los usuarios que sigue A incluyendo a B", async () => {
    await supabaseAdmin.from("follows").insert({
      follower_id: USER_A.user_id,
      following_id: USER_B.user_id,
    });

    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await getFollowing(USER_A.user_id, USER_A.user_id);

    expect(result.error).toBeNull();
    expect(result.data?.some((u) => u.user_id === USER_B.user_id)).toBe(true);
  });

  it("respeta los parámetros de paginación", async () => {
    await supabaseAdmin.from("follows").insert({
      follower_id: USER_A.user_id,
      following_id: USER_B.user_id,
    });

    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await getFollowing(USER_A.user_id, USER_A.user_id, {
      page: 0,
      limit: 1,
    });

    expect(result.error).toBeNull();
    expect(result.data?.length).toBeLessThanOrEqual(1);
  });

  it("retorna error con UUID inválido", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await getFollowing("no-es-uuid", USER_A.user_id);

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });
});

describe("getFriends — integración", () => {
  it("retorna a B como amigo de A cuando el follow es mutuo", async () => {
    await supabaseAdmin.from("follows").insert([
      { follower_id: USER_A.user_id, following_id: USER_B.user_id },
      { follower_id: USER_B.user_id, following_id: USER_A.user_id },
    ]);

    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await getFriends(USER_A.user_id);

    expect(result.error).toBeNull();
    expect(result.data?.some((u) => u.user_id === USER_B.user_id)).toBe(true);
  });

  it("retorna lista vacía cuando no hay amigos mutuos", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await getFriends(USER_A.user_id);

    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });

  it("retorna error con UUID inválido", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await getFriends("no-es-uuid");

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });
});
