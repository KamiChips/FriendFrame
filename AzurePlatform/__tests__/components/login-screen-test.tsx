import { fireEvent, render } from "@testing-library/react-native";

import { LoginScreen } from "@/screens/LoginScreen";

describe("<LoginScreen />", () => {
  test("envia el correo y la contrasena capturados", () => {
    const onSubmit = jest.fn();
    const { getByLabelText, getByRole } = render(<LoginScreen onSubmit={onSubmit} />);

    fireEvent.changeText(getByLabelText("Correo"), "admin@friendframe.test");
    fireEvent.changeText(getByLabelText("Contraseña"), "clave-de-prueba");
    fireEvent.press(getByRole("button", { name: "Iniciar sesión" }));

    expect(onSubmit).toHaveBeenCalledWith({
      email: "admin@friendframe.test",
      password: "clave-de-prueba",
    });
  });

  test("avisa cuando se pide recuperar la contrasena", () => {
    const onForgotPassword = jest.fn();
    const { getByRole } = render(<LoginScreen onForgotPassword={onForgotPassword} />);
    fireEvent.press(getByRole("link", { name: "¿Olvidaste tu contraseña?" }));
    expect(onForgotPassword).toHaveBeenCalledTimes(1);
  });
});
