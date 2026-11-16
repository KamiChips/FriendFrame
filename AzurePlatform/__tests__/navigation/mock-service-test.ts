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

  test("restaurar una cuenta la deja activa", async () => {
    await mockModeration.restoreAccount("u1");
    expect((await mockModeration.getUser("u1"))?.status).toBe("active");
  });

  test("quitar un rol saca al miembro del equipo", async () => {
    await mockModeration.removeRole("m3");
    const { members } = await mockModeration.getTeam();
    expect(members.map((member) => member.id)).not.toContain("m3");
  });

  test("devuelve null para registros que no existen", async () => {
    expect(await mockModeration.getReport("no-existe")).toBeNull();
    expect(await mockModeration.getUser("no-existe")).toBeNull();
  });
});
