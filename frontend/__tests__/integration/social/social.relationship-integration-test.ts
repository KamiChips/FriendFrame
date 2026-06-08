import { signIn, signOut } from "@/services/supabase/auth/auth.sign-in";
import {
  getRelationshipStatus,
  getFriends,
} from "@/services/supabase/social/social.relationship";
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

describe("getRelationshipStatus — integración", () => {
  it("todos los campos son false cuando no hay relación", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await getRelationshipStatus(USER_B.user_id);

    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({
      i_follow_them: false,
      they_follow_me: false,
      is_friend: false,
      is_blocked: false,
      blocked_me: false,
    });
  });

  it("i_follow_them es true cuando A sigue a B", async () => {
    await supabaseAdmin.from("follows").insert({
      follower_id: USER_A.user_id,
      following_id: USER_B.user_id,
    });

    await signIn({ email: USER_A.email, password: USER_A.password });
    const result = await getRelationshipStatus(USER_B.user_id);

    expect(result.error).toBeNull();
    expect(result.data?.i_follow_them).toBe(true);
    expect(result.data?.they_follow_me).toBe(false);
    expect(result.data?.is_friend).toBe(false);
  });

  it("they_follow_me es true cuando B sigue a A", async () => {
    await supabaseAdmin.from("follows").insert({
      follower_id: USER_B.user_id,
      following_id: USER_A.user_id,
    });

    await signIn({ email: USER_A.email, password: USER_A.password });
    const result = await getRelationshipStatus(USER_B.user_id);

    expect(result.error).toBeNull();
    expect(result.data?.i_follow_them).toBe(false);
    expect(result.data?.they_follow_me).toBe(true);
    expect(result.data?.is_friend).toBe(false);
  });

  it("is_friend es true cuando el follow es mutuo", async () => {
    await supabaseAdmin.from("follows").insert([
      { follower_id: USER_A.user_id, following_id: USER_B.user_id },
      { follower_id: USER_B.user_id, following_id: USER_A.user_id },
    ]);

    await signIn({ email: USER_A.email, password: USER_A.password });
    const result = await getRelationshipStatus(USER_B.user_id);

    expect(result.error).toBeNull();
    expect(result.data?.i_follow_them).toBe(true);
    expect(result.data?.they_follow_me).toBe(true);
    expect(result.data?.is_friend).toBe(true);
  });

  it("is_blocked es true cuando A ha bloqueado a B", async () => {
    await supabaseAdmin.from("blocks").insert({
      blocker_id: USER_A.user_id,
      blocked_id: USER_B.user_id,
    });

    await signIn({ email: USER_A.email, password: USER_A.password });
    const result = await getRelationshipStatus(USER_B.user_id);

    expect(result.error).toBeNull();
    expect(result.data?.is_blocked).toBe(true);
    expect(result.data?.blocked_me).toBe(false);
  });

  it("blocked_me es true cuando B ha bloqueado a A", async () => {
    await supabaseAdmin.from("blocks").insert({
      blocker_id: USER_B.user_id,
      blocked_id: USER_A.user_id,
    });

    await signIn({ email: USER_A.email, password: USER_A.password });
    const result = await getRelationshipStatus(USER_B.user_id);

    expect(result.error).toBeNull();
    expect(result.data?.is_blocked).toBe(false);
    expect(result.data?.blocked_me).toBe(true);
  });

  it("retorna error si no hay sesión activa", async () => {
    const result = await getRelationshipStatus(USER_B.user_id);

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });

  it("retorna error con UUID inválido", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await getRelationshipStatus("no-es-uuid");

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });
});

describe("getFriends — integración", () => {
  it("retorna los amigos de A cuando hay follows mutuos", async () => {
    await supabaseAdmin.from("follows").insert([
      { follower_id: USER_A.user_id, following_id: USER_B.user_id },
      { follower_id: USER_B.user_id, following_id: USER_A.user_id },
    ]);

    const result = await getFriends(USER_A.user_id);

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data![0].user_id).toBe(USER_B.user_id);
  });

  it("retorna lista vacía si A no tiene amigos", async () => {
    const result = await getFriends(USER_A.user_id);

    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });

  it("no retorna como amigo a alguien que A sigue pero que no sigue a A", async () => {
    await supabaseAdmin.from("follows").insert({
      follower_id: USER_A.user_id,
      following_id: USER_B.user_id,
    });

    const result = await getFriends(USER_A.user_id);

    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });

  it("cada amigo retornado contiene los campos requeridos", async () => {
    await supabaseAdmin.from("follows").insert([
      { follower_id: USER_A.user_id, following_id: USER_B.user_id },
      { follower_id: USER_B.user_id, following_id: USER_A.user_id },
    ]);

    const result = await getFriends(USER_A.user_id);

    expect(result.data![0]).toMatchObject({
      user_id: expect.any(String),
      username: expect.any(String),
      full_name: expect.any(String),
      i_follow_them: true,
      is_friend: true,
    });
  });

  it("retorna error con UUID inválido", async () => {
    const result = await getFriends("no-es-uuid");

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });
});
