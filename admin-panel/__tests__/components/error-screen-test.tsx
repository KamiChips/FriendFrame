import { fireEvent, render } from "@testing-library/react-native";

import { ErrorScreen } from "@/screens/ErrorScreen";

import { buildShell } from "../fixtures/shell";

describe("<ErrorScreen />", () => {
  test("explica la falta de permisos y regresa al dashboard", () => {
    const onAction = jest.fn();
    const { getByRole, getByText } = render(
      <ErrorScreen shell={buildShell()} kind="forbidden" activeSection="reports" onAction={onAction} />,
    );
    expect(getByRole("header", { name: "Error 403" })).toBeTruthy();
    expect(getByText("Moderación / Reportes")).toBeTruthy();
    expect(getByText("No tienes permiso para ver esta sección")).toBeTruthy();
    fireEvent.press(getByRole("button", { name: "Volver al dashboard" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  test("avisa de una pagina inexistente", () => {
    const { getByRole, getByText } = render(<ErrorScreen shell={buildShell()} kind="not-found" />);
    expect(getByRole("header", { name: "Error 404" })).toBeTruthy();
    expect(getByText("No encontramos esta página")).toBeTruthy();
    expect(getByText("El enlace no existe o la página cambió de lugar.")).toBeTruthy();
  });

  test("ofrece recargar ante un error inesperado", () => {
    const onAction = jest.fn();
    const { getByRole, getByText } = render(
      <ErrorScreen shell={buildShell()} kind="unexpected" onAction={onAction} />,
    );
    expect(getByText("Ups...")).toBeTruthy();
    expect(getByText("Algo salió mal")).toBeTruthy();
    fireEvent.press(getByRole("button", { name: "Recargar" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  test("muestra los reportes abiertos en la cabecera", () => {
    const { getByText } = render(<ErrorScreen shell={buildShell()} kind="not-found" />);
    expect(getByText("23 abiertos")).toBeTruthy();
  });
});
