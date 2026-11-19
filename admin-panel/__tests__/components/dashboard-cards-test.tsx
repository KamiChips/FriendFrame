import { fireEvent, render } from "@testing-library/react-native";

import { BarChartCard } from "@/components/dashboard/BarChartCard";
import { DonutChartCard } from "@/components/dashboard/DonutChartCard";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ReviewCasesCard } from "@/components/dashboard/ReviewCasesCard";

import { metrics, reasons, reviewCases, weeklyReports } from "@/fixtures/dashboard";

describe("<MetricCard />", () => {
  test("muestra etiqueta, valor, detalle e icono de la metrica", () => {
    const { getByText, getByTestId } = render(<MetricCard metric={metrics[0]} />);
    expect(getByText("Reportes abiertos")).toBeTruthy();
    expect(getByText("23")).toBeTruthy();
    expect(getByText("8 pendientes de asignar")).toBeTruthy();
    expect(getByTestId("icon-flag")).toBeTruthy();
  });
});

describe("<BarChartCard />", () => {
  const props = { title: "Reportes", subtitle: "Por semana", periodLabel: "Semanal" };

  test("muestra cada barra con su etiqueta y valor", () => {
    const { getByText, getAllByText } = render(<BarChartCard {...props} bars={weeklyReports} />);
    expect(getByText("Sem. 6")).toBeTruthy();
    expect(getByText("44")).toBeTruthy();
    // 35 aparece en la semana 5 y en la 8
    expect(getAllByText("35")).toHaveLength(2);
  });

  test("ajusta la escala al valor mas alto", () => {
    const { getByText } = render(
      <BarChartCard
        {...props}
        bars={[
          { label: "A", value: 21 },
          { label: "B", value: 44 },
        ]}
      />,
    );
    ["60", "40", "20", "0"].forEach((tick) => expect(getByText(tick)).toBeTruthy());
  });

  test("dibuja barras proporcionales a su valor", () => {
    const { getByTestId } = render(
      <BarChartCard
        {...props}
        bars={[
          { label: "A", value: 20 },
          { label: "B", value: 40 },
        ]}
      />,
    );
    const height = (id: string) => getByTestId(id).props.style.height;
    expect(height("bar-B")).toBeCloseTo(height("bar-A") * 2);
  });

  test("resume el periodo actual y su variacion frente al anterior", () => {
    const { getByText } = render(
      <BarChartCard {...props} bars={weeklyReports} summaryPrefix="Semana actual" unit="reportes" />,
    );
    expect(getByText("Semana actual: 35 reportes")).toBeTruthy();
    expect(getByText("↓ 19% frente a la anterior")).toBeTruthy();
  });

  test("indica cuando el periodo actual sube", () => {
    const { getByText } = render(
      <BarChartCard
        {...props}
        bars={[
          { label: "A", value: 20 },
          { label: "B", value: 25 },
        ]}
      />,
    );
    expect(getByText("↑ 25% frente a la anterior")).toBeTruthy();
  });
});

describe("<DonutChartCard />", () => {
  const props = { title: "¿Qué se reporta?", periodLabel: "últimos 7 días" };

  test("lista cada motivo con su porcentaje", () => {
    const { getByText } = render(<DonutChartCard {...props} reasons={reasons} />);
    expect(getByText("Spam")).toBeTruthy();
    expect(getByText("30%")).toBeTruthy();
    expect(getByText("Suplantación")).toBeTruthy();
    expect(getByText("10%")).toBeTruthy();
  });

  test("muestra el total y el periodo en el centro", () => {
    const { getByText } = render(<DonutChartCard {...props} reasons={reasons} />);
    expect(getByText("100%")).toBeTruthy();
    expect(getByText("últimos 7 días")).toBeTruthy();
  });

  test("destaca los dos motivos principales", () => {
    const { getByText } = render(<DonutChartCard {...props} reasons={reasons} />);
    expect(getByText("Spam y acoso concentran el 55% de los reportes.")).toBeTruthy();
  });

  test("dibuja un segmento por motivo", () => {
    const { getAllByTestId } = render(<DonutChartCard {...props} reasons={reasons} />);
    expect(getAllByTestId("donut-segment")).toHaveLength(reasons.length);
  });
});

describe("<ReviewCasesCard />", () => {
  test("muestra cuantos casos hay y el detalle de cada uno", () => {
    const { getByText } = render(<ReviewCasesCard cases={reviewCases} />);
    expect(getByText("Mis casos en revisión (2)")).toBeTruthy();
    expect(getByText("FF-1048 · Acoso · Post")).toBeTruthy();
    expect(getByText("@carlos_dev")).toBeTruthy();
    expect(getByText("Hace 12 min")).toBeTruthy();
  });

  test("avisa que caso se quiere abrir", () => {
    const onOpenCase = jest.fn();
    const { getByRole } = render(<ReviewCasesCard cases={reviewCases} onOpenCase={onOpenCase} />);
    fireEvent.press(getByRole("button", { name: "Abrir caso FF-1042" }));
    expect(onOpenCase).toHaveBeenCalledWith("c-1042");
  });

  test("avisa cuando se piden todos los casos", () => {
    const onViewAll = jest.fn();
    const { getByRole } = render(<ReviewCasesCard cases={reviewCases} onViewAll={onViewAll} />);
    fireEvent.press(getByRole("link", { name: "Ver mis casos" }));
    expect(onViewAll).toHaveBeenCalledTimes(1);
  });
});
