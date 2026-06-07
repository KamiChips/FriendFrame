import { signIn, signOut } from "@/services/supabase/auth/auth.sign-in";
import {
  followUser,
  unfollowUser,
  toggleFollow,
  isFollowing,
  getFollowers,
  getFollowing,
} from "@/services/supabase/social/social.follows";
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

describe("followUser — integración", () => {
  it("A puede seguir a B correctamente", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await followUser(USER_B.user_id);

    expect(result.error).toBeNull();
    expect(result.data?.follow.follower_id).toBe(USER_A.user_id);
    expect(result.data?.follow.following_id).toBe(USER_B.user_id);
  });

  it("el registro de follow se guarda en la base de datos", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    await followUser(USER_B.user_id);

    const { data } = await supabaseAdmin
      .from("follows")
      .select("*")
      .eq("follower_id", USER_A.user_id)
      .eq("following_id", USER_B.user_id)
      .single();

    expect(data).not.toBeNull();
  });

  it("is_friend es true cuando el follow es mutuo", async () => {
    // B sigue a A primero
    await supabaseAdmin.from("follows").insert({
      follower_id: USER_B.user_id,
      following_id: USER_A.user_id,
    });

    await signIn({ email: USER_A.email, password: USER_A.password });
    const result = await followUser(USER_B.user_id);

    expect(result.error).toBeNull();
    expect(result.data?.is_friend).toBe(true);
  });

  it("is_friend es false cuando el follow no es mutuo", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await followUser(USER_B.user_id);

    expect(result.error).toBeNull();
    expect(result.data?.is_friend).toBe(false);
  });

  it("retorna error al intentar seguirse a sí mismo", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await followUser(USER_A.user_id);

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });

  it("retorna error al seguir a alguien que ya se sigue", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    await followUser(USER_B.user_id);
    const result = await followUser(USER_B.user_id);

    expect(result.error).toBe("Ya sigues a este usuario.");
    expect(result.data).toBeNull();
  });

  it("retorna error si A ha bloqueado a B", async () => {
    await supabaseAdmin.from("blocks").insert({
      blocker_id: USER_A.user_id,
      blocked_id: USER_B.user_id,
    });

    await signIn({ email: USER_A.email, password: USER_A.password });
    const result = await followUser(USER_B.user_id);

    expect(result.error).toBe("Has bloqueado a este usuario.");
    expect(result.data).toBeNull();
  });

  it("retorna error si B ha bloqueado a A", async () => {
    await supabaseAdmin.from("blocks").insert({
      blocker_id: USER_B.user_id,
      blocked_id: USER_A.user_id,
    });

    await signIn({ email: USER_A.email, password: USER_A.password });
    const result = await followUser(USER_B.user_id);

    expect(result.error).toBe("No puedes seguir a este usuario.");
    expect(result.data).toBeNull();
  });

  it("retorna error si no hay sesión activa", async () => {
    const result = await followUser(USER_B.user_id);

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });

  it("retorna error con UUID inválido", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await followUser("no-es-uuid");

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });
});

describe("unfollowUser — integración", () => {
  it("A puede dejar de seguir a B correctamente", async () => {
    await supabaseAdmin.from("follows").insert({
      follower_id: USER_A.user_id,
      following_id: USER_B.user_id,
    });

    await signIn({ email: USER_A.email, password: USER_A.password });
    const result = await unfollowUser(USER_B.user_id);

    expect(result.error).toBeNull();

    const { data } = await supabaseAdmin
      .from("follows")
      .select("follow_id")
      .eq("follower_id", USER_A.user_id)
      .eq("following_id", USER_B.user_id)
      .maybeSingle();

    expect(data).toBeNull();
  });

  it("no lanza error al dejar de seguir a alguien que no se sigue", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await unfollowUser(USER_B.user_id);

    expect(result.error).toBeNull();
  });

  it("retorna error si no hay sesión activa", async () => {
    const result = await unfollowUser(USER_B.user_id);

    expect(result.error).not.toBeNull();
  });

  it("retorna error con UUID inválido", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await unfollowUser("no-es-uuid");

    expect(result.error).not.toBeNull();
  });
});

describe("toggleFollow — integración", () => {
  it("activa el follow si A no sigue a B", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await toggleFollow(USER_B.user_id);

    expect(result.error).toBeNull();
    expect(result.data?.following).toBe(true);
  });

  it("desactiva el follow si A ya sigue a B", async () => {
    await supabaseAdmin.from("follows").insert({
      follower_id: USER_A.user_id,
      following_id: USER_B.user_id,
    });

    await signIn({ email: USER_A.email, password: USER_A.password });
    const result = await toggleFollow(USER_B.user_id);

    expect(result.error).toBeNull();
    expect(result.data?.following).toBe(false);
    expect(result.data?.is_friend).toBe(false);
  });

  it("is_friend es true cuando el follow es mutuo tras toggleFollow", async () => {
    await supabaseAdmin.from("follows").insert({
      follower_id: USER_B.user_id,
      following_id: USER_A.user_id,
    });

    await signIn({ email: USER_A.email, password: USER_A.password });
    const result = await toggleFollow(USER_B.user_id);

    expect(result.error).toBeNull();
    expect(result.data?.following).toBe(true);
    expect(result.data?.is_friend).toBe(true);
  });

  it("retorna error si A bloqueó a B", async () => {
    await supabaseAdmin.from("blocks").insert({
      blocker_id: USER_A.user_id,
      blocked_id: USER_B.user_id,
    });

    await signIn({ email: USER_A.email, password: USER_A.password });
    const result = await toggleFollow(USER_B.user_id);

    expect(result.error).toBe("Has bloqueado a este usuario.");
    expect(result.data).toBeNull();
  });

  it("retorna error si no hay sesión activa", async () => {
    const result = await toggleFollow(USER_B.user_id);

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });
});

describe("isFollowing — integración", () => {
  it("retorna true cuando A sigue a B", async () => {
    await supabaseAdmin.from("follows").insert({
      follower_id: USER_A.user_id,
      following_id: USER_B.user_id,
    });

    await signIn({ email: USER_A.email, password: USER_A.password });
    const result = await isFollowing(USER_B.user_id);

    expect(result.error).toBeNull();
    expect(result.data).toBe(true);
  });

  it("retorna false cuando A no sigue a B", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await isFollowing(USER_B.user_id);

    expect(result.error).toBeNull();
    expect(result.data).toBe(false);
  });

  it("retorna error si no hay sesión activa", async () => {
    const result = await isFollowing(USER_B.user_id);

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });
});

describe("getFollowing — integración", () => {
  it("retorna la lista de usuarios que sigue A", async () => {
    await supabaseAdmin.from("follows").insert({
      follower_id: USER_A.user_id,
      following_id: USER_B.user_id,
    });

    const result = await getFollowing(USER_A.user_id, USER_A.user_id);

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data![0].user_id).toBe(USER_B.user_id);
  });

  it("retorna lista vacía si A no sigue a nadie", async () => {
    const result = await getFollowing(USER_A.user_id, USER_A.user_id);

    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });

  it("cada usuario retornado contiene los campos requeridos", async () => {
    await supabaseAdmin.from("follows").insert({
      follower_id: USER_A.user_id,
      following_id: USER_B.user_id,
    });

    const result = await getFollowing(USER_A.user_id, USER_A.user_id);

    expect(result.data![0]).toMatchObject({
      user_id: expect.any(String),
      username: expect.any(String),
      full_name: expect.any(String),
      i_follow_them: expect.any(Boolean),
      is_friend: expect.any(Boolean),
    });
  });

  it("retorna error con UUID inválido", async () => {
    const result = await getFollowing("no-es-uuid", USER_A.user_id);

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });
});

describe("getFollowers — integración", () => {
  it("retorna la lista de seguidores de B", async () => {
    await supabaseAdmin.from("follows").insert({
      follower_id: USER_A.user_id,
      following_id: USER_B.user_id,
    });

    const result = await getFollowers(USER_B.user_id, USER_B.user_id);

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data![0].user_id).toBe(USER_A.user_id);
  });

  it("retorna lista vacía si B no tiene seguidores", async () => {
    const result = await getFollowers(USER_B.user_id, USER_B.user_id);

    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });

  it("cada seguidor retornado contiene los campos requeridos", async () => {
    await supabaseAdmin.from("follows").insert({
      follower_id: USER_A.user_id,
      following_id: USER_B.user_id,
    });

    const result = await getFollowers(USER_B.user_id, USER_B.user_id);

    expect(result.data![0]).toMatchObject({
      user_id: expect.any(String),
      username: expect.any(String),
      full_name: expect.any(String),
      i_follow_them: expect.any(Boolean),
      is_friend: expect.any(Boolean),
    });
  });

  it("retorna error con UUID inválido", async () => {
    const result = await getFollowers("no-es-uuid", USER_B.user_id);

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });
});
