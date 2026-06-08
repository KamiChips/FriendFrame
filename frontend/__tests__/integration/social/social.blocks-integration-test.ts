import { signIn, signOut } from "@/services/supabase/auth/auth.sign-in";
import {
  blockUser,
  unblockUser,
  isBlocked,
  getBlockedUsers,
} from "@/services/supabase/social/social.blocks";
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
  await supabaseAdmin.from("blocks").delete().in("blocker_id", ids);
  await supabaseAdmin.from("follows").delete().in("follower_id", ids);
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

describe("blockUser — integración", () => {
  it("A puede bloquear a B correctamente", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await blockUser(USER_B.user_id);

    expect(result.error).toBeNull();
    expect(result.data?.blocker_id).toBe(USER_A.user_id);
    expect(result.data?.blocked_id).toBe(USER_B.user_id);
  });

  it("el registro de bloqueo se guarda en la base de datos", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    await blockUser(USER_B.user_id);

    const { data } = await supabaseAdmin
      .from("blocks")
      .select("*")
      .eq("blocker_id", USER_A.user_id)
      .eq("blocked_id", USER_B.user_id)
      .single();

    expect(data).not.toBeNull();
  });

  it("bloquear elimina el follow propio del bloqueador hacia el bloqueado", async () => {
    // Establecer follows mutuos
    await supabaseAdmin.from("follows").insert([
      { follower_id: USER_A.user_id, following_id: USER_B.user_id },
      { follower_id: USER_B.user_id, following_id: USER_A.user_id },
    ]);

    await signIn({ email: USER_A.email, password: USER_A.password });
    await blockUser(USER_B.user_id);

    // El follow de A hacia B (propio del usuario autenticado) se elimina
    const { data: followsAB } = await supabaseAdmin
      .from("follows")
      .select("follow_id")
      .eq("follower_id", USER_A.user_id)
      .eq("following_id", USER_B.user_id)
      .maybeSingle();

    expect(followsAB).toBeNull();

    // Nota: el intento de eliminar el follow de B hacia A queda sujeto a RLS
    // (el cliente actúa como A, que no tiene permiso para borrar filas de B),
    // por lo que ese follow puede persistir tras el bloqueo.
  });

  it("retorna error al intentar bloquearse a sí mismo", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await blockUser(USER_A.user_id);

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });

  it("retorna error al bloquear a alguien ya bloqueado", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    await blockUser(USER_B.user_id);
    const result = await blockUser(USER_B.user_id);

    expect(result.error).toBe("Ya has bloqueado a este usuario.");
    expect(result.data).toBeNull();
  });

  it("retorna error si no hay sesión activa", async () => {
    const result = await blockUser(USER_B.user_id);

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });

  it("retorna error con UUID inválido", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await blockUser("no-es-uuid");

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });
});

describe("unblockUser — integración", () => {
  it("A puede desbloquear a B correctamente", async () => {
    await supabaseAdmin.from("blocks").insert({
      blocker_id: USER_A.user_id,
      blocked_id: USER_B.user_id,
    });

    await signIn({ email: USER_A.email, password: USER_A.password });
    const result = await unblockUser(USER_B.user_id);

    expect(result.error).toBeNull();

    const { data } = await supabaseAdmin
      .from("blocks")
      .select("block_id")
      .eq("blocker_id", USER_A.user_id)
      .eq("blocked_id", USER_B.user_id)
      .maybeSingle();

    expect(data).toBeNull();
  });

  it("no lanza error al desbloquear a alguien que no estaba bloqueado", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await unblockUser(USER_B.user_id);

    expect(result.error).toBeNull();
  });

  it("retorna error si no hay sesión activa", async () => {
    const result = await unblockUser(USER_B.user_id);

    expect(result.error).not.toBeNull();
  });

  it("retorna error con UUID inválido", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await unblockUser("no-es-uuid");

    expect(result.error).not.toBeNull();
  });
});

describe("isBlocked — integración", () => {
  it("i_blocked_them es true cuando A bloqueó a B", async () => {
    await supabaseAdmin.from("blocks").insert({
      blocker_id: USER_A.user_id,
      blocked_id: USER_B.user_id,
    });

    await signIn({ email: USER_A.email, password: USER_A.password });
    const result = await isBlocked(USER_B.user_id);

    expect(result.error).toBeNull();
    expect(result.data?.i_blocked_them).toBe(true);
    expect(result.data?.they_blocked_me).toBe(false);
  });

  it("they_blocked_me es true cuando B bloqueó a A", async () => {
    await supabaseAdmin.from("blocks").insert({
      blocker_id: USER_B.user_id,
      blocked_id: USER_A.user_id,
    });

    await signIn({ email: USER_A.email, password: USER_A.password });
    const result = await isBlocked(USER_B.user_id);

    expect(result.error).toBeNull();
    expect(result.data?.i_blocked_them).toBe(false);
    expect(result.data?.they_blocked_me).toBe(true);
  });

  it("ambos son false cuando no hay ningún bloqueo", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await isBlocked(USER_B.user_id);

    expect(result.error).toBeNull();
    expect(result.data?.i_blocked_them).toBe(false);
    expect(result.data?.they_blocked_me).toBe(false);
  });

  it("retorna error si no hay sesión activa", async () => {
    const result = await isBlocked(USER_B.user_id);

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });

  it("retorna error con UUID inválido", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await isBlocked("no-es-uuid");

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });
});

describe("getBlockedUsers — integración", () => {
  it("retorna la lista de usuarios bloqueados por A", async () => {
    await supabaseAdmin.from("blocks").insert({
      blocker_id: USER_A.user_id,
      blocked_id: USER_B.user_id,
    });

    await signIn({ email: USER_A.email, password: USER_A.password });
    const result = await getBlockedUsers();

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data![0].user_id).toBe(USER_B.user_id);
  });

  it("retorna lista vacía si A no ha bloqueado a nadie", async () => {
    await signIn({ email: USER_A.email, password: USER_A.password });

    const result = await getBlockedUsers();

    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });

  it("cada usuario bloqueado contiene los campos requeridos", async () => {
    await supabaseAdmin.from("blocks").insert({
      blocker_id: USER_A.user_id,
      blocked_id: USER_B.user_id,
    });

    await signIn({ email: USER_A.email, password: USER_A.password });
    const result = await getBlockedUsers();

    expect(result.data![0]).toMatchObject({
      user_id: expect.any(String),
      username: expect.any(String),
      full_name: expect.any(String),
      blocked_at: expect.any(String),
    });
    expect(result.data![0]).toHaveProperty("profile_pic");
  });

  it("no incluye usuarios bloqueados por otros en la lista de A", async () => {
    // B bloquea a A — no debe aparecer en la lista de bloqueados de A
    await supabaseAdmin.from("blocks").insert({
      blocker_id: USER_B.user_id,
      blocked_id: USER_A.user_id,
    });

    await signIn({ email: USER_A.email, password: USER_A.password });
    const result = await getBlockedUsers();

    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });

  it("retorna error si no hay sesión activa", async () => {
    const result = await getBlockedUsers();

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });
});
