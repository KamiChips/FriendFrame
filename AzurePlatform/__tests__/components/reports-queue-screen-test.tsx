import { fireEvent, render, within } from "@testing-library/react-native";

import { reports } from "@/fixtures/reports";
import { ReportsQueueScreen } from "@/screens/ReportsQueueScreen";

import { buildShell } from "../fixtures/shell";

function renderQueue(overrides = {}) {
  return render(
    <ReportsQueueScreen
      shell={buildShell()}
      openCount={23}
      filters={{ status: "Pendiente", contentType: "Todos", reason: "Todos" }}
      assignedToMe={false}
      newReportsCount={3}
      reports={reports}
      totalReports={23}
      dateLabel="8 nov 2026"
      {...overrides}
    />,
  );
}

describe("<ReportsQueueScreen />", () => {
  test("muestra cuantos reportes hay abiertos", () => {
    const { getByText } = renderQueue();
    expect(getByText("23 abiertos")).toBeTruthy();
  });

  test("muestra el valor actual de cada filtro", () => {
    const { getByText } = renderQueue();
    expect(getByText("Estado: Pendiente")).toBeTruthy();
    expect(getByText("Tipo: Todos")).toBeTruthy();
    expect(getByText("Motivo: Todos")).toBeTruthy();
  });

  test("avisa que filtro se quiere cambiar", () => {
    const onOpenFilter = jest.fn();
    const { getByRole } = renderQueue({ onOpenFilter });
    fireEvent.press(getByRole("button", { name: "Motivo: Todos" }));
    expect(onOpenFilter).toHaveBeenCalledWith("reason");
  });

  test("avisa al alternar los reportes asignados a mi", () => {
    const onToggleAssignedToMe = jest.fn();
    const { getByRole } = renderQueue({ onToggleAssignedToMe });
    fireEvent.press(getByRole("switch", { name: "Asignados a mí" }));
    expect(onToggleAssignedToMe).toHaveBeenCalledWith(true);
  });

  test("avisa al limpiar los filtros", () => {
    const onClearFilters = jest.fn();
    const { getByRole } = renderQueue({ onClearFilters });
    fireEvent.press(getByRole("button", { name: "Limpiar filtros" }));
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });

  test("anuncia los reportes nuevos y avisa al pedir verlos", () => {
    const onShowNewReports = jest.fn();
    const { getByRole } = renderQueue({ onShowNewReports });
    fireEvent.press(getByRole("button", { name: "3 reportes nuevos — clic para ver" }));
    expect(onShowNewReports).toHaveBeenCalledTimes(1);
  });

  test("no anuncia reportes nuevos cuando no hay", () => {
    const { queryByText } = renderQueue({ newReportsCount: 0 });
    expect(queryByText(/clic para ver/)).toBeNull();
  });

  test("muestra los datos de cada reporte", () => {
    const { getByRole } = renderQueue();
    const row = within(getByRole("button", { name: "Abrir reporte de @ana.rmz, Hace 25 min" }));
    expect(row.getByText("Mensaje de chat")).toBeTruthy();
    expect(row.getByText("Otro")).toBeTruthy();
    expect(row.getByText("1")).toBeTruthy();
    expect(row.getByText("Pendiente")).toBeTruthy();
    expect(row.getByText("Sin asignar")).toBeTruthy();
  });

  test("muestra a quien esta asignado un reporte", () => {
    const assigned = [{ ...reports[0], assignee: "@sofia.mod" }];
    const { getByText, queryByText } = renderQueue({ reports: assigned });
    expect(getByText("@sofia.mod")).toBeTruthy();
    expect(queryByText("Sin asignar")).toBeNull();
  });

  test("avisa que reporte se quiere abrir", () => {
    const onOpenReport = jest.fn();
    const { getByRole } = renderQueue({ onOpenReport });
    fireEvent.press(getByRole("button", { name: "Abrir reporte de @luis.fotos, Hace 42 min" }));
    expect(onOpenReport).toHaveBeenCalledWith("r5");
  });

  test("resume cuantos reportes se muestran del total", () => {
    const { getByText } = renderQueue();
    expect(getByText("Mostrando 9 de 23 reportes · 8 nov 2026")).toBeTruthy();
  });

  test("permite cargar mas mientras falten reportes", () => {
    const onLoadMore = jest.fn();
    const { getByRole } = renderQueue({ onLoadMore });
    fireEvent.press(getByRole("button", { name: "Cargar más" }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  test("no ofrece cargar mas cuando ya se muestran todos", () => {
    const { queryByRole } = renderQueue({ totalReports: reports.length });
    expect(queryByRole("button", { name: "Cargar más" })).toBeNull();
  });
});
