import { resolutionFeedback } from "@/pages/reports/report-feedback";
import { toReportQuery } from "@/pages/reports/report-query";
import { banConfirmSchema, loginSchema, resolutionSchema } from "@/schemas/forms";
import { parseSearch, reportsSearchSchema, toSearch } from "@/schemas/search";

import { formatCount, joinDates } from "./format";
import { closingNotice, highlightFor, summarizeSanctions, trendFor } from "./summaries";

describe("textos derivados", () => {
  test("la tendencia compara la ultima semana con la anterior", () => {
    expect(
      trendFor([
        { label: "a", value: 40 },
        { label: "b", value: 30 },
      ]),
    ).toEqual({
      label: "↓ 25% frente a la anterior",
      isDrop: true,
    });
    expect(
      trendFor([
        { label: "a", value: 10 },
        { label: "b", value: 10 },
      ])?.label,
    ).toBe("Sin cambio frente a la anterior");
    expect(
      trendFor([
        { label: "a", value: 0 },
        { label: "b", value: 3 },
      ]),
    ).toBeNull();
  });

  test("destaca los dos motivos mas reportados", () => {
    expect(
      highlightFor([
        { label: "Spam", percent: 20 },
        { label: "Acoso", percent: 35 },
        { label: "Otro", percent: 45 },
      ]),
    ).toBe("Otro y acoso concentran el 80% de los reportes.");
  });

  test("resume sanciones por gravedad", () => {
    expect(summarizeSanctions([])).toBe("Sin sanciones previas");
    expect(
      summarizeSanctions([
        { id: "1", kind: "ban", detail: "", date: "" },
        { id: "2", kind: "warning", detail: "", date: "" },
        { id: "3", kind: "warning", detail: "", date: "" },
      ]),
    ).toBe("2 advertencias · 1 baneo");
  });

  test("avisa cuantos reportes se cierran junto con el actual", () => {
    expect(closingNotice(0)).toBeNull();
    expect(closingNotice(1)).toMatch(/el otro reporte/);
    expect(closingNotice(3)).toMatch(/los otros 3 reportes/);
  });

  test("formatea fechas y cifras", () => {
    expect(formatCount(1284)).toBe("1.284");
    expect(joinDates(["7 nov 2026", "6 nov 2026"])).toBe("7 nov y 6 nov 2026");
  });

  test("redacta el aviso de una suspension con su fecha de fin", () => {
    const feedback = resolutionFeedback(
      { action: "suspend", suspensionDays: 7, notes: "" },
      "@carlos_dev",
      3,
      new Date(2026, 10, 8),
    );
    expect(feedback).toEqual({
      title: "Usuario suspendido hasta el 15 nov",
      message: "@carlos_dev · 3 reportes cerrados",
      notice: "Cola actualizada · 3 reportes resueltos",
    });
  });
});

describe("esquemas", () => {
  test("el login exige correo valido y contrasena", () => {
    expect(loginSchema.safeParse({ email: "x", password: "" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@friendframe.test", password: "x" }).success).toBe(true);
  });

  test("suspender exige duracion y banear exige notas", () => {
    expect(resolutionSchema.safeParse({ action: "suspend", notes: "" }).success).toBe(false);
    expect(resolutionSchema.safeParse({ action: "suspend", suspensionDays: 7, notes: "" }).success).toBe(
      true,
    );
    expect(resolutionSchema.safeParse({ action: "ban", notes: "  " }).success).toBe(false);
    expect(resolutionSchema.safeParse({ action: "dismiss", notes: "" }).success).toBe(true);
  });

  test("el baneo solo se confirma con el handle exacto", () => {
    const schema = banConfirmSchema("@carlos_dev");
    expect(schema.safeParse({ typedHandle: "@carlos", notes: "x" }).success).toBe(false);
    expect(schema.safeParse({ typedHandle: "@carlos_dev", notes: "x" }).success).toBe(true);
  });

  test("los filtros de la URL ignoran valores invalidos", () => {
    const search = parseSearch(reportsSearchSchema, new URLSearchParams("status=raro&type=post&mine=1"));
    expect(search).toMatchObject({ status: undefined, type: "post", mine: "1" });
    expect(toReportQuery(search)).toEqual({
      status: "pending",
      contentType: "post",
      reason: undefined,
      assignedToMe: true,
    });
    expect(toReportQuery({ status: "all" }).status).toBeUndefined();
    expect(toSearch({ a: "1", b: undefined, c: "" })).toBe("?a=1");
  });
});
