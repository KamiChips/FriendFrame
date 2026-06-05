import {
  addComment,
  editComment,
  deleteComment,
  getComments,
  getReplies,
} from "@/services/supabase/interactions/comments";
import { signIn, signOut } from "@/services/supabase/auth/auth.sign-in";
import { supabaseAdmin } from "./helpers/supabase-test-client";

// ─── Usuarios de prueba ────────────────────────────────────────────────────────
const TEST_USER_A = {
  email: process.env.TEST_USER_EMAIL!,
  password: process.env.TEST_USER_PASSWORD!,
  full_name: "Integration Comments A",
  username: "integration_comments_a",
};

const TEST_USER_B = {
  email: process.env.TEST_USER_B_EMAIL!,
  password: process.env.TEST_USER_B_PASSWORD!,
  full_name: "Integration Comments B",
  username: "integration_comments_b",
};

// ─── IDs compartidos entre tests ──────────────────────────────────────────────
let testPostId: string;
let testFragmentId: string;
let userAId: string;
let userBId: string;

// ─── Helpers de setup / teardown ──────────────────────────────────────────────
async function getSupabaseUserId(email: string): Promise<string | null> {
  const { data } = await supabaseAdmin.auth.admin.listUsers();
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    ?.id ?? null;
}

async function deleteAuthUser(email: string) {
  const id = await getSupabaseUserId(email);
  if (id) await supabaseAdmin.auth.admin.deleteUser(id);
}

async function cleanupUser(email: string) {
  await supabaseAdmin.from("users").delete().eq("email", email);
  await deleteAuthUser(email);
}

async function createTestPost(authorId: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .insert({ user_id: authorId, content: "Post de prueba para comentarios" })
    .select("post_id")
    .single();
  if (error) throw new Error(`No se pudo crear post: ${error.message}`);
  return data.post_id;
}

async function createTestFragment(authorId: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("fragments")
    .insert({ user_id: authorId, content: "Fragmento de prueba para comentarios" })
    .select("fragment_id")
    .single();
  if (error) throw new Error(`No se pudo crear fragmento: ${error.message}`);
  return data.fragment_id;
}

async function deleteAllComments() {
  if (testPostId)
    await supabaseAdmin.from("comments").delete().eq("post_id", testPostId);
  if (testFragmentId)
    await supabaseAdmin.from("comments").delete().eq("fragment_id", testFragmentId);
}

// ─── Setup global ─────────────────────────────────────────────────────────────
beforeAll(async () => {
  // Limpiar usuarios residuales
  await cleanupUser(TEST_USER_A.email);
  await cleanupUser(TEST_USER_B.email);

  // Crear usuario A
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

  // Crear usuario B
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

  // Crear publicaciones de prueba con usuario A
  await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });
  testPostId = await createTestPost(userAId);
  testFragmentId = await createTestFragment(userAId);
  await signOut();
});

afterAll(async () => {
  await signOut();
  await deleteAllComments();

  if (testPostId)
    await supabaseAdmin.from("posts").delete().eq("post_id", testPostId);
  if (testFragmentId)
    await supabaseAdmin.from("fragments").delete().eq("fragment_id", testFragmentId);

  await cleanupUser(TEST_USER_A.email);
  await cleanupUser(TEST_USER_B.email);
});

beforeEach(async () => {
  await signOut();
  await deleteAllComments();
});

afterEach(async () => {
  await signOut();
});

// ─── addComment ───────────────────────────────────────────────────────────────
describe("addComment — integración", () => {
  it("agrega un comentario a un post correctamente", async () => {
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });

    const result = await addComment({ postId: testPostId }, "Hola mundo");

    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({
      content: "Hola mundo",
      post_id: testPostId,
      parent_comment_id: null,
    });
    expect(result.data?.author).toMatchObject({
      username: TEST_USER_A.username,
    });
  });

  it("agrega un comentario a un fragmento correctamente", async () => {
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });

    const result = await addComment(
      { fragmentId: testFragmentId },
      "Comentario en fragmento"
    );

    expect(result.error).toBeNull();
    expect(result.data?.fragment_id).toBe(testFragmentId);
  });

  it("agrega una respuesta anidada a un comentario raíz", async () => {
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });

    const root = await addComment({ postId: testPostId }, "Comentario raíz");
    expect(root.error).toBeNull();

    const reply = await addComment(
      { postId: testPostId },
      "Respuesta al raíz",
      root.data!.comment_id
    );

    expect(reply.error).toBeNull();
    expect(reply.data?.parent_comment_id).toBe(root.data!.comment_id);
  });

  it("retorna error si el comentario padre no pertenece al post", async () => {
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });

    // UUID válido pero inexistente en este post
    const fakeParentId = "00000000-0000-0000-0000-000000000000";
    const result = await addComment(
      { postId: testPostId },
      "Intento con padre inválido",
      fakeParentId
    );

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });

  it("retorna error si el contenido está vacío", async () => {
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });

    const result = await addComment({ postId: testPostId }, "   ");

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });

  it("retorna error si no hay sesión activa", async () => {
    const result = await addComment({ postId: testPostId }, "Sin sesión");

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });
});

// ─── editComment ──────────────────────────────────────────────────────────────
describe("editComment — integración", () => {
  it("edita el contenido de un comentario propio", async () => {
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });

    const created = await addComment({ postId: testPostId }, "Antes de editar");
    const commentId = created.data!.comment_id;

    const result = await editComment(commentId, "Después de editar");

    expect(result.error).toBeNull();
    expect(result.data?.content).toBe("Después de editar");
    expect(result.data?.comment_id).toBe(commentId);
  });

  it("no permite editar el comentario de otro usuario", async () => {
    // Usuario A crea el comentario
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });
    const created = await addComment({ postId: testPostId }, "Comentario de A");
    const commentId = created.data!.comment_id;
    await signOut();

    // Usuario B intenta editarlo
    await signIn({ email: TEST_USER_B.email, password: TEST_USER_B.password });
    const result = await editComment(commentId, "Editado por B");

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });

  it("retorna error si el contenido nuevo está vacío", async () => {
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });

    const created = await addComment({ postId: testPostId }, "Contenido válido");
    const result = await editComment(created.data!.comment_id, "");

    expect(result.error).not.toBeNull();
  });
});

// ─── deleteComment ────────────────────────────────────────────────────────────
describe("deleteComment — integración", () => {
  it("elimina un comentario propio", async () => {
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });

    const created = await addComment({ postId: testPostId }, "Para eliminar");
    const commentId = created.data!.comment_id;

    const result = await deleteComment(commentId);
    expect(result.error).toBeNull();

    // Verificar que ya no existe en la BD
    const { data } = await supabaseAdmin
      .from("comments")
      .select("comment_id")
      .eq("comment_id", commentId)
      .maybeSingle();
    expect(data).toBeNull();
  });

  it("no elimina el comentario de otro usuario", async () => {
    // A crea el comentario
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });
    const created = await addComment({ postId: testPostId }, "De A, no borrable por B");
    const commentId = created.data!.comment_id;
    await signOut();

    // B intenta eliminarlo
    await signIn({ email: TEST_USER_B.email, password: TEST_USER_B.password });
    await deleteComment(commentId);

    // Verificar que aún existe en la BD
    const { data } = await supabaseAdmin
      .from("comments")
      .select("comment_id")
      .eq("comment_id", commentId)
      .maybeSingle();
    expect(data).not.toBeNull();
  });

  it("no lanza error si se intenta eliminar un comentario inexistente", async () => {
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });

    const result = await deleteComment("00000000-0000-0000-0000-000000000000");
    expect(result.error).toBeNull();
  });
});

// ─── getComments ──────────────────────────────────────────────────────────────
describe("getComments — integración", () => {
  it("devuelve lista vacía si no hay comentarios", async () => {
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });

    const result = await getComments({ postId: testPostId }, userAId);

    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });

  it("devuelve solo comentarios raíz por defecto", async () => {
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });

    const root = await addComment({ postId: testPostId }, "Raíz");
    await addComment({ postId: testPostId }, "Respuesta", root.data!.comment_id);

    const result = await getComments({ postId: testPostId }, userAId);

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data![0].parent_comment_id).toBeNull();
  });

  it("devuelve el árbol completo con include_replies: true", async () => {
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });

    const root = await addComment({ postId: testPostId }, "Raíz");
    await addComment({ postId: testPostId }, "Hijo", root.data!.comment_id);

    const result = await getComments(
      { postId: testPostId },
      userAId,
      { include_replies: true }
    );

    expect(result.error).toBeNull();
    // El árbol debe contener el raíz con su hijo anidado
    const rootComment = result.data!.find(
      (c) => c.comment_id === root.data!.comment_id
    );
    expect(rootComment).toBeDefined();
    expect(rootComment!.replies).toHaveLength(1);
  });

  it("cada comentario tiene los campos requeridos", async () => {
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });
    await addComment({ postId: testPostId }, "Verificar campos");

    const result = await getComments({ postId: testPostId }, userAId);

    expect(result.data![0]).toMatchObject({
      comment_id: expect.any(String),
      content: expect.any(String),
      likes_count: expect.any(Number),
      replies_count: expect.any(Number),
      liked_by_me: expect.any(Boolean),
      author: expect.objectContaining({
        user_id: expect.any(String),
        username: expect.any(String),
      }),
    });
  });

  it("funciona también con fragmentId como target", async () => {
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });
    await addComment({ fragmentId: testFragmentId }, "En fragmento");

    const result = await getComments({ fragmentId: testFragmentId }, userAId);

    expect(result.error).toBeNull();
    expect(result.data!.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── getReplies ───────────────────────────────────────────────────────────────
describe("getReplies — integración", () => {
  it("devuelve las respuestas de un comentario raíz", async () => {
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });

    const root = await addComment({ postId: testPostId }, "Raíz con respuestas");
    await addComment({ postId: testPostId }, "Respuesta 1", root.data!.comment_id);
    await addComment({ postId: testPostId }, "Respuesta 2", root.data!.comment_id);

    const result = await getReplies(root.data!.comment_id, userAId);

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);
    result.data!.forEach((reply) => {
      expect(reply.parent_comment_id).toBe(root.data!.comment_id);
    });
  });

  it("devuelve lista vacía si el comentario no tiene respuestas", async () => {
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });

    const root = await addComment({ postId: testPostId }, "Sin respuestas");
    const result = await getReplies(root.data!.comment_id, userAId);

    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });

  it("retorna error con un UUID inválido", async () => {
    await signIn({ email: TEST_USER_A.email, password: TEST_USER_A.password });

    const result = await getReplies("no-es-un-uuid", userAId);

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });
});