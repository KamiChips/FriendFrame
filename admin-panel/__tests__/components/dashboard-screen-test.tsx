import { fireEvent, render } from "@testing-library/react-native";

import { DashboardScreen } from "@/screens/DashboardScreen";

import { metrics, reasons, reviewCases, weeklyReports } from "@/fixtures/dashboard";
import { buildShell } from "../fixtures/shell";

function renderDashboard(overrides = {}) {
  return render(
    <DashboardScreen
      shell={buildShell()}
      adminName="Admin"
      dateLabel="8 de noviembre de 2026"
      metrics={metrics}
      weeklyReports={weeklyReports}
      reasons={reasons}
      reviewCases={reviewCases}
      {...overrides}
    />,
  );
}

describe("<DashboardScreen />", () => {
  test("saluda al administrador con la fecha recibida", () => {
    const { getByText } = renderDashboard();
    expect(
      getByText("Hola, Admin. Este es el pulso de la comunidad hoy, 8 de noviembre de 2026."),
    ).toBeTruthy();
  });

  test("marca dashboard como seccion activa", () => {
    const { getByRole } = renderDashboard();
    expect(getByRole("link", { name: "Dashboard" }).props.accessibilityState.selected).toBe(true);
  });

  test("muestra todas las metricas recibidas", () => {
    const { getByText } = renderDashboard();
    metrics.forEach((metric) => expect(getByText(metric.label)).toBeTruthy());
  });

  test("describe el periodo del grafico segun las semanas recibidas", () => {
    const { getByText } = renderDashboard();
    expect(getByText("Reportes resueltos · últimas 8 semanas")).toBeTruthy();
  });

  test("avisa al pedir la cola de reportes", () => {
    const onOpenQueue = jest.fn();
    const { getByRole } = renderDashboard({ onOpenQueue });
    fireEvent.press(getByRole("button", { name: "Ver cola de reportes" }));
    expect(onOpenQueue).toHaveBeenCalledTimes(1);
  });

  test("avisa al pedir la guia de moderacion", () => {
    const onOpenGuide = jest.fn();
    const { getByRole } = renderDashboard({ onOpenGuide });
    fireEvent.press(getByRole("link", { name: "Consultar guía de moderación" }));
    expect(onOpenGuide).toHaveBeenCalledTimes(1);
  });

  test("se muestra sin datos", () => {
    const { getByText } = renderDashboard({
      metrics: [],
      weeklyReports: [],
      reasons: [],
      reviewCases: [],
    });
    expect(getByText("Mis casos en revisión (0)")).toBeTruthy();
  });
});
