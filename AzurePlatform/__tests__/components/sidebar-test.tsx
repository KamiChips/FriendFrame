import { fireEvent, render } from "@testing-library/react-native";

import { Sidebar } from "@/components/layout/Sidebar";

const user = { handle: "@admin", initials: "A", role: "Admin" };

describe("<Sidebar />", () => {
  test("lista las secciones de la consola", () => {
    const { getByText } = render(<Sidebar activeSection="dashboard" currentUser={user} />);
    ["Dashboard", "Reportes", "Usuarios", "Bitácora", "Equipo"].forEach((label) =>
      expect(getByText(label)).toBeTruthy(),
    );
  });

  test("marca solo la seccion activa", () => {
    const { getByRole } = render(<Sidebar activeSection="reports" currentUser={user} />);
    expect(getByRole("link", { name: "Reportes" }).props.accessibilityState.selected).toBe(true);
    expect(getByRole("link", { name: "Dashboard" }).props.accessibilityState.selected).toBe(false);
  });

  test("muestra el recuento recibido para una seccion", () => {
    const { getByText } = render(
      <Sidebar activeSection="dashboard" currentUser={user} sectionCounts={{ reports: 23 }} />,
    );
    expect(getByText("23")).toBeTruthy();
  });

  test("avisa a que seccion se quiere navegar", () => {
    const onNavigate = jest.fn();
    const { getByRole } = render(
      <Sidebar activeSection="dashboard" currentUser={user} onNavigate={onNavigate} />,
    );
    fireEvent.press(getByRole("link", { name: "Usuarios" }));
    expect(onNavigate).toHaveBeenCalledWith("users");
  });

  test("muestra al usuario actual con su rol", () => {
    const { getByText } = render(
      <Sidebar
        activeSection="dashboard"
        currentUser={{ handle: "@sofia.mod", initials: "SM", role: "Moderador" }}
      />,
    );
    expect(getByText("@sofia.mod")).toBeTruthy();
    expect(getByText("SM")).toBeTruthy();
    expect(getByText("Moderador")).toBeTruthy();
  });

  test("avisa al cerrar sesion", () => {
    const onSignOut = jest.fn();
    const { getByRole } = render(
      <Sidebar activeSection="dashboard" currentUser={user} onSignOut={onSignOut} />,
    );
    fireEvent.press(getByRole("button", { name: "Cerrar sesión" }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });
});
