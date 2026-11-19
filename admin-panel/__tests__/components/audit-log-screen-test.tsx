import { fireEvent, render, within } from "@testing-library/react-native";

import { auditEntries } from "@/fixtures/audit";
import { AuditLogScreen } from "@/screens/AuditLogScreen";

import { buildShell } from "../fixtures/shell";

function renderAudit(overrides = {}) {
  return render(
    <AuditLogScreen
      shell={buildShell()}
      filters={{ moderator: "Todos", action: "Todas", dateRange: "1–8 nov 2026" }}
      entries={auditEntries}
      totalEntries={126}
      {...overrides}
    />,
  );
}

describe("<AuditLogScreen />", () => {
  test("marca bitacora como seccion activa y de solo admin", () => {
    const { getByRole, getByText } = renderAudit();
    expect(getByRole("link", { name: "Bitácora" }).props.accessibilityState.selected).toBe(true);
    expect(getByText("Solo Admin")).toBeTruthy();
  });

  test("muestra el valor de cada filtro", () => {
    const { getByRole } = renderAudit();
    expect(getByRole("button", { name: "Moderador: Todos" })).toBeTruthy();
    expect(getByRole("button", { name: "Acción: Todas" })).toBeTruthy();
    expect(getByRole("button", { name: "1–8 nov 2026" })).toBeTruthy();
  });

  test("avisa que filtro se quiere cambiar", () => {
    const onOpenFilter = jest.fn();
    const { getByRole } = renderAudit({ onOpenFilter });
    fireEvent.press(getByRole("button", { name: "1–8 nov 2026" }));
    expect(onOpenFilter).toHaveBeenCalledWith("dateRange");
  });

  test("avisa al limpiar los filtros", () => {
    const onClearFilters = jest.fn();
    const { getByRole } = renderAudit({ onClearFilters });
    fireEvent.press(getByRole("button", { name: "Limpiar filtros" }));
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });

  test("muestra quien hizo que, sobre quien y por que", () => {
    const { getByTestId } = renderAudit();
    const row = within(getByTestId("audit-row-a5"));
    expect(row.getByText("8 nov · 10:18")).toBeTruthy();
    expect(row.getByText("2026")).toBeTruthy();
    expect(row.getByText("@moderador2")).toBeTruthy();
    expect(row.getByText("Ocultó contenido")).toBeTruthy();
    expect(row.getByText("Post de @luis.fotos")).toBeTruthy();
    expect(row.getByText("Spam repetido en varios perfiles.")).toBeTruthy();
  });

  test("avisa que reporte relacionado se quiere abrir", () => {
    const onOpenReport = jest.fn();
    const { getByTestId } = renderAudit({ onOpenReport });
    fireEvent.press(within(getByTestId("audit-row-a4")).getByRole("link", { name: "FF-1041" }));
    expect(onOpenReport).toHaveBeenCalledWith("r-1041");
  });

  test("indica cuando una accion no tiene reporte relacionado", () => {
    const { getByTestId } = renderAudit();
    const row = within(getByTestId("audit-row-a7"));
    expect(row.getByText("—")).toBeTruthy();
    expect(row.queryByRole("link")).toBeNull();
  });

  test("resume cuantas acciones se muestran del total", () => {
    const { getByText } = renderAudit();
    expect(getByText("8 de 126 acciones · Horario local")).toBeTruthy();
  });

  test("permite cargar mas mientras falten acciones", () => {
    const onLoadMore = jest.fn();
    const { getByRole } = renderAudit({ onLoadMore });
    fireEvent.press(getByRole("button", { name: "Cargar más" }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  test("no ofrece cargar mas cuando ya se muestran todas", () => {
    const { queryByRole } = renderAudit({ totalEntries: auditEntries.length });
    expect(queryByRole("button", { name: "Cargar más" })).toBeNull();
  });
});
