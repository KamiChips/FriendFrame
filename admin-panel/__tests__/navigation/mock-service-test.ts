import { AuthError } from "@/services/moderation/types";
import { mockModeration } from "@/services/moderation/mock";

beforeEach(() => {
  mockModeration.reset();
});

describe("servicio simulado de moderacion", () => {
  test("filtra la cola por estado, tipo, motivo y asignacion", async () => {
    const all = await mockModeration.getReports({});
    const spam = await mockModeration.getReports({ reason: "Spam" });
    const posts = await mockModeration.getReports({ contentType: "post" });
    const mine = await mockModeration.getReports({ assignedToMe: true });

    expect(all.reports).toHaveLength(9);
    expect(spam.reports.every((report) => report.reason === "Spam")).toBe(true);
    expect(posts.reports.every((report) => report.contentType === "post")).toBe(true);
    expect(mine.reports).toHaveLength(0);
  });

  test("tomar un caso lo asigna al usuario actual", async () => {
    await mockModeration.takeCase("r2");

    const detail = await mockModeration.getReport("r2");
    const mine = await mockModeration.getReports({ assignedToMe: true });
    expect(detail?.status).toBe("in_review");
    expect(detail?.assignee).toBe("@admin");
    expect(mine.reports.map((report) => report.id)).toEqual(["r2"]);
  });

  test("resolver un caso lo saca de la cola de pendientes", async () => {
    await mockModeration.takeCase("r2");
    await mockModeration.resolveReport("r2", { action: "dismiss", notes: "" });

    const pending = await mockModeration.getReports({ status: "pending" });
    expect(pending.reports.map((report) => report.id)).not.toContain("r2");
    expect((await mockModeration.getReport("r2"))?.status).toBe("resolved");
  });

  test("busca usuarios por nombre o handle y por estado", async () => {
    const byName = await mockModeration.getUsers({ query: "ana" });
    const byHandle = await mockModeration.getUsers({ query: "@luis" });
    const banned = await mockModeration.getUsers({ status: "banned" });

    expect(byName.users.map((user) => user.handle)).toEqual(["@ana.rmz"]);
    expect(byHandle.users.map((user) => user.handle)).toEqual(["@luis.fotos"]);
    expect(banned.users.map((user) => user.handle)).toEqual(["@luis.fotos"]);
  });

  test("restaurar una cuenta la deja activa y lo anota en su linea de tiempo", async () => {
    await mockModeration.restoreAccount("u1", "Apelación revisada");
    const profile = await mockModeration.getUser("u1");
    expect(profile?.status).toBe("active");
    expect(profile?.timeline[0]).toMatchObject({ kind: "restoration", title: "Cuenta restaurada", note: "Apelación revisada" });
  });

  test("restaurar contenido oculto lo saca de la lista del perfil", async () => {
    const before = await mockModeration.getUser("u1");
    const [first] = before?.hiddenContent ?? [];
    await mockModeration.restoreContent("u1", first.id);
    const after = await mockModeration.getUser("u1");
    expect(after?.hiddenContent.map((item) => item.id)).not.toContain(first.id);
  });

  test("resolver con una sancion cierra los otros reportes del contenido y sanciona al autor", async () => {
    await mockModeration.takeCase("r1");
    const outcome = await mockModeration.resolveReport("r1", { action: "ban", notes: "Reincidencia" });

    expect(outcome.closedCount).toBe(3);
    const [author] = (await mockModeration.getUsers({ query: "@carlos_dev" })).users;
    expect(author.status).toBe("banned");
  });

  test("agregar un miembro lo suma al equipo con su rol", async () => {
    await mockModeration.addMember("u6", "moderator");
    const { members } = await mockModeration.getTeam();
    expect(members.find((member) => member.handle === "@sofia.crea")?.role).toBe("moderator");
    const { entries } = await mockModeration.getAuditLog({ action: "granted_role" });
    expect(entries[0].target).toBe("@sofia.crea");
  });

  test("quitar un rol saca al miembro del equipo", async () => {
    await mockModeration.removeRole("m3");
    const { members } = await mockModeration.getTeam();
    expect(members.map((member) => member.id)).not.toContain("m3");
  });

  test("rechaza credenciales incompletas o cortas", async () => {
    await expect(mockModeration.signIn({ email: "", password: "" })).rejects.toMatchObject({ reason: "invalid_credentials" });
    await expect(
      mockModeration.signIn({ email: "admin@friendframe.test", password: "123" }),
    ).rejects.toBeInstanceOf(AuthError);
  });

  test("rechaza cuentas fuera del equipo", async () => {
    await expect(
      mockModeration.signIn({ email: "ana@gmail.com", password: "clave-de-prueba" }),
    ).rejects.toMatchObject({ reason: "not_authorized" });
  });

  test("el correo de moderador entra con permisos de moderador", async () => {
    await mockModeration.signIn({ email: "moderador@friendframe.test", password: "clave-de-prueba" });
    expect(await mockModeration.getCurrentUser()).toMatchObject({ handle: "@moderador1", role: "moderator" });
  });

  test("marca la evidencia expirada o borrada por el autor", async () => {
    expect((await mockModeration.getReport("r3"))?.content.evidenceStatus).toBe("expired");
    expect((await mockModeration.getReport("r8"))?.content.evidenceStatus).toBe("deleted");
  });

  test("devuelve null para registros que no existen", async () => {
    expect(await mockModeration.getReport("no-existe")).toBeNull();
    expect(await mockModeration.getUser("no-existe")).toBeNull();
  });
});
