import { fireEvent, render } from "@testing-library/react-native";

import { ResolutionPanel } from "@/components/reports/ResolutionPanel";

// 8 de noviembre de 2026, fecha del diseno
const today = new Date(2026, 10, 8);

function renderPanel(overrides = {}) {
  return render(
    <ResolutionPanel
      authorHandle="@carlos_dev"
      otherPendingCount={2}
      referenceDate={today}
      {...overrides}
    />,
  );
}

describe("<ResolutionPanel />", () => {
  test("indica sobre que autor se aplica la accion", () => {
    const { getByText } = renderPanel();
    expect(getByText("Selecciona una acción para @carlos_dev.")).toBeTruthy();
  });

  test("ofrece todas las acciones de resolucion", () => {
    const { getByRole } = renderPanel();
    ["Descartar", "Ocultar contenido", "Advertir al autor", "Suspender autor", "Banear autor"].forEach(
      (name) => expect(getByRole("radio", { name })).toBeTruthy(),
    );
  });

  test("no permite aplicar sin elegir una accion", () => {
    const onSubmit = jest.fn();
    const { getByRole } = renderPanel({ onSubmit });
    fireEvent.press(getByRole("button", { name: "Aplicar" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("pide la duracion solo al suspender", () => {
    const { getByRole, queryByText } = renderPanel();
    expect(queryByText("Duración de la suspensión")).toBeNull();

    fireEvent.press(getByRole("radio", { name: "Suspender autor" }));
    expect(queryByText("Duración de la suspensión")).toBeTruthy();

    fireEvent.press(getByRole("radio", { name: "Descartar" }));
    expect(queryByText("Duración de la suspensión")).toBeNull();
  });

  test("calcula hasta cuando dura la suspension", () => {
    const { getByRole, getByText } = renderPanel();
    fireEvent.press(getByRole("radio", { name: "Suspender autor" }));
    fireEvent.press(getByRole("button", { name: "7 días" }));
    expect(getByText("Suspendido hasta: 15 nov 2026")).toBeTruthy();
  });

  test("entrega la suspension con su duracion y las notas", () => {
    const onSubmit = jest.fn();
    const { getByRole, getByLabelText } = renderPanel({ onSubmit });

    fireEvent.press(getByRole("radio", { name: "Suspender autor" }));
    fireEvent.press(getByRole("button", { name: "7 días" }));
    fireEvent.changeText(getByLabelText("Notas internas"), "Acoso reiterado.");
    fireEvent.press(getByRole("button", { name: "Aplicar suspensión" }));

    expect(onSubmit).toHaveBeenCalledWith({
      action: "suspend",
      suspensionDays: 7,
      notes: "Acoso reiterado.",
    });
  });

  test("no permite suspender sin elegir duracion", () => {
    const onSubmit = jest.fn();
    const { getByRole } = renderPanel({ onSubmit });
    fireEvent.press(getByRole("radio", { name: "Suspender autor" }));
    fireEvent.press(getByRole("button", { name: "Aplicar suspensión" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("entrega las demas acciones sin duracion", () => {
    const onSubmit = jest.fn();
    const { getByRole } = renderPanel({ onSubmit });
    fireEvent.press(getByRole("radio", { name: "Advertir al autor" }));
    fireEvent.press(getByRole("button", { name: "Enviar advertencia" }));
    expect(onSubmit).toHaveBeenCalledWith({ action: "warn", notes: "" });
  });

  test("el baneo exige notas internas", () => {
    const onSubmit = jest.fn();
    const { getByRole, getByLabelText, getByText } = renderPanel({ onSubmit });
    fireEvent.press(getByRole("radio", { name: "Banear autor" }));
    expect(getByText("Notas internas · obligatorio")).toBeTruthy();

    fireEvent.press(getByRole("button", { name: "Continuar con el baneo" }));
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.changeText(getByLabelText("Notas internas"), "Reincidencia.");
    expect(getByText("13 / 500")).toBeTruthy();
    fireEvent.press(getByRole("button", { name: "Continuar con el baneo" }));
    expect(onSubmit).toHaveBeenCalledWith({ action: "ban", notes: "Reincidencia." });
  });

  test("avisa que se cerraran los otros reportes pendientes", () => {
    const { getByText } = renderPanel();
    expect(
      getByText("Se cerrarán también los otros 2 reportes pendientes de este contenido"),
    ).toBeTruthy();
  });

  test("no muestra el aviso si no hay otros reportes pendientes", () => {
    const { queryByText } = renderPanel({ otherPendingCount: 0 });
    expect(queryByText(/Se cerrará/)).toBeNull();
  });
});
