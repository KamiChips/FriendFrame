import { fireEvent, render } from "@testing-library/react-native";

import { TextField } from "@/components/ui/TextField";

describe("<TextField />", () => {
  test("muestra la etiqueta y el valor", () => {
    const { getByText, getByDisplayValue } = render(
      <TextField label="Correo" value="admin@friendframe.test" />,
    );
    expect(getByText("Correo")).toBeTruthy();
    expect(getByDisplayValue("admin@friendframe.test")).toBeTruthy();
  });

  test("avisa cuando cambia el texto", () => {
    const onChangeText = jest.fn();
    const { getByLabelText } = render(
      <TextField label="Correo" value="" onChangeText={onChangeText} />,
    );
    fireEvent.changeText(getByLabelText("Correo"), "nuevo@friendframe.test");
    expect(onChangeText).toHaveBeenCalledWith("nuevo@friendframe.test");
  });

  test("oculta la contrasena hasta que se pide verla", () => {
    const { getByLabelText, getByTestId } = render(
      <TextField label="Contraseña" value="secreta" secureTextEntry />,
    );
    expect(getByLabelText("Contraseña").props.secureTextEntry).toBe(true);
    expect(getByTestId("icon-eye-off")).toBeTruthy();

    fireEvent.press(getByLabelText("Mostrar contraseña"));
    expect(getByLabelText("Contraseña").props.secureTextEntry).toBe(false);
    expect(getByTestId("icon-eye")).toBeTruthy();

    fireEvent.press(getByLabelText("Ocultar contraseña"));
    expect(getByLabelText("Contraseña").props.secureTextEntry).toBe(true);
  });
});
