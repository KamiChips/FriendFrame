import { fireEvent, render } from "@testing-library/react-native";

import { Button } from "@/components/ui/Button";

describe("<Button />", () => {
  test("muestra la etiqueta recibida", () => {
    const { getByText } = render(<Button label="Iniciar sesión" />);
    expect(getByText("Iniciar sesión")).toBeTruthy();
  });

  test("avisa al presionarlo", () => {
    const onPress = jest.fn();
    const { getByRole } = render(<Button label="Continuar" onPress={onPress} />);
    fireEvent.press(getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test("no avisa si esta deshabilitado", () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <Button label="Continuar" onPress={onPress} disabled />,
    );
    fireEvent.press(getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });

  test("muestra el icono indicado", () => {
    const { getByTestId } = render(
      <Button label="Ver cola de reportes" variant="primary" icon="arrow-up-right" />,
    );
    expect(getByTestId("icon-arrow-up-right")).toBeTruthy();
  });
});
