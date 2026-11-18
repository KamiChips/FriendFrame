import { fireEvent, render, within } from "@testing-library/react-native";

import { users } from "@/fixtures/users";
import { UsersScreen } from "@/screens/UsersScreen";

import { buildShell } from "../fixtures/shell";

function renderUsers(overrides = {}) {
  return render(
    <UsersScreen
      shell={buildShell()}
      totalAccounts={1284}
      statusFilter="Todos"
      users={users}
      hasMore
      {...overrides}
    />,
  );
}

describe("<UsersScreen />", () => {
  test("muestra el total de cuentas con separador de miles", () => {
    const { getByText } = renderUsers();
    expect(getByText("1.284 cuentas")).toBeTruthy();
  });

  test("entrega el texto buscado al presionar buscar", () => {
    const onSearch = jest.fn();
    const { getByLabelText, getByRole } = renderUsers({ onSearch });
    fireEvent.changeText(getByLabelText("Buscar por nombre o @username"), "carlos");
    fireEvent.press(getByRole("button", { name: "Buscar" }));
    expect(onSearch).toHaveBeenCalledWith("carlos");
  });

  test("muestra el filtro de estado y avisa al abrirlo", () => {
    const onOpenStatusFilter = jest.fn();
    const { getByRole } = renderUsers({ statusFilter: "Suspendidas", onOpenStatusFilter });
    fireEvent.press(getByRole("button", { name: "Estado: Suspendidas" }));
    expect(onOpenStatusFilter).toHaveBeenCalledTimes(1);
  });

  test("resume cuantas cuentas se encontraron", () => {
    const { getByText } = renderUsers();
    expect(getByText("6 cuentas · ordenadas por actividad reciente")).toBeTruthy();
  });

  test("muestra los datos de cada cuenta", () => {
    const { getByTestId } = renderUsers();
    const row = within(getByTestId("user-row-u4"));
    expect(row.getByText("Luis Torres")).toBeTruthy();
    expect(row.getByText("@luis.fotos")).toBeTruthy();
    expect(row.getByText("Baneada")).toBeTruthy();
    expect(row.getByText("8")).toBeTruthy();
    expect(row.getByText("6 nov 2026")).toBeTruthy();
  });

  test("distingue cuentas activas y suspendidas", () => {
    const { getByTestId } = renderUsers();
    expect(within(getByTestId("user-row-u1")).getByText("Suspendida")).toBeTruthy();
    expect(within(getByTestId("user-row-u2")).getByText("Activa")).toBeTruthy();
  });

  test("avisa de que cuenta se quiere ver el perfil", () => {
    const onViewProfile = jest.fn();
    const { getByRole } = renderUsers({ onViewProfile });
    fireEvent.press(getByRole("link", { name: "Ver perfil de @ana.rmz" }));
    expect(onViewProfile).toHaveBeenCalledWith("u3");
  });

  test("permite cargar mas solo si hay mas cuentas", () => {
    const onLoadMore = jest.fn();
    const { getByRole, rerender, queryByRole } = renderUsers({ onLoadMore });
    fireEvent.press(getByRole("button", { name: "Cargar más" }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    rerender(
      <UsersScreen shell={buildShell()} totalAccounts={6} statusFilter="Todos" users={users} hasMore={false} />,
    );
    expect(queryByRole("button", { name: "Cargar más" })).toBeNull();
  });
});
