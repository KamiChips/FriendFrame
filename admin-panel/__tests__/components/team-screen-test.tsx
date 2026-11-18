import { fireEvent, render, within } from "@testing-library/react-native";

import { teamMembers } from "@/fixtures/audit";
import { TeamScreen } from "@/screens/TeamScreen";

import { buildShell } from "../fixtures/shell";

function renderTeam(overrides = {}) {
  return render(
    <TeamScreen
      shell={buildShell()}
      members={teamMembers}
      lastUpdated="8 nov 2026 · 11:05"
      {...overrides}
    />,
  );
}

describe("<TeamScreen />", () => {
  test("resume el tamano del equipo por rol", () => {
    const { getByText } = renderTeam();
    expect(getByText("4 miembros")).toBeTruthy();
    expect(getByText("2 admins")).toBeTruthy();
    expect(getByText("2 moderadores")).toBeTruthy();
  });

  test("usa singular cuando solo hay un miembro de un rol", () => {
    const { getByText } = renderTeam({ members: teamMembers.slice(0, 2) });
    expect(getByText("2 miembros")).toBeTruthy();
    expect(getByText("1 admin")).toBeTruthy();
    expect(getByText("1 moderador")).toBeTruthy();
  });

  test("muestra rol, quien lo otorgo y fecha de alta de cada miembro", () => {
    const { getByTestId } = renderTeam();
    const row = within(getByTestId("member-row-m2"));
    expect(row.getByText("Diego Ruiz")).toBeTruthy();
    expect(row.getByText("@moderador2")).toBeTruthy();
    expect(row.getByText("Moderador")).toBeTruthy();
    expect(row.getByText("@admin")).toBeTruthy();
    expect(row.getByText("2 nov 2026")).toBeTruthy();
  });

  test("senala al usuario actual y que su rol viene del sistema", () => {
    const { getByTestId } = renderTeam();
    const row = within(getByTestId("member-row-m1"));
    expect(row.getByText("Admin (tú)")).toBeTruthy();
    expect(row.getByText("Sistema")).toBeTruthy();
  });

  test("confirma antes de quitar el rol a un miembro", () => {
    const onRemoveRole = jest.fn();
    const { getByRole, getByText, getAllByRole } = renderTeam({ onRemoveRole });
    fireEvent.press(getByRole("button", { name: "Quitar rol a @maria.lopez" }));
    expect(onRemoveRole).not.toHaveBeenCalled();
    expect(
      getByText("@maria.lopez perderá el acceso al panel. Su cuenta de FriendFrame seguirá activa."),
    ).toBeTruthy();

    // el boton de la confirmacion es el ultimo con esa etiqueta
    const confirmButtons = getAllByRole("button", { name: "Quitar rol" });
    fireEvent.press(confirmButtons[confirmButtons.length - 1]);
    expect(onRemoveRole).toHaveBeenCalledWith("m3");
  });

  test("cancelar la confirmacion no quita el rol", () => {
    const onRemoveRole = jest.fn();
    const { getByRole, queryByText } = renderTeam({ onRemoveRole });
    fireEvent.press(getByRole("button", { name: "Quitar rol a @maria.lopez" }));
    fireEvent.press(getByRole("button", { name: "Cancelar" }));
    expect(onRemoveRole).not.toHaveBeenCalled();
    expect(queryByText(/perderá el acceso al panel/)).toBeNull();
  });

  test("no permite que el usuario se quite su propio rol", () => {
    const onRemoveRole = jest.fn();
    const { getByRole, getByText } = renderTeam({ onRemoveRole });
    fireEvent.press(getByRole("button", { name: "Quitar rol a @admin" }));
    expect(onRemoveRole).not.toHaveBeenCalled();
    expect(getByText("No puedes quitarte tu propio rol")).toBeTruthy();
  });

  test("agrega un miembro buscado con el rol elegido", () => {
    const onAddMember = jest.fn();
    const onSearchCandidate = jest.fn();
    const candidate = { id: "u6", handle: "@sofia.crea", initials: "SV" };
    const { getByRole, getByLabelText, getByText, getAllByRole, rerender } = renderTeam({
      onAddMember,
      onSearchCandidate,
    });
    fireEvent.press(getByRole("button", { name: "Agregar miembro" }));
    // sin candidato no se puede agregar
    const confirmButton = () => getByRole("button", { name: "Agregar" });
    fireEvent.press(confirmButton());
    expect(onAddMember).not.toHaveBeenCalled();

    fireEvent.changeText(getByLabelText("Buscar por nombre o @username"), "@sofia");
    expect(onSearchCandidate).toHaveBeenLastCalledWith("@sofia");

    rerender(
      <TeamScreen
        shell={buildShell()}
        members={teamMembers}
        lastUpdated="8 nov 2026 · 11:05"
        candidate={candidate}
        onAddMember={onAddMember}
        onSearchCandidate={onSearchCandidate}
      />,
    );
    expect(getByText("@sofia.crea")).toBeTruthy();
    fireEvent.press(getByRole("radio", { name: "Admin" }));
    fireEvent.press(confirmButton());
    expect(onAddMember).toHaveBeenCalledWith("u6", "admin");
    expect(getAllByRole("button", { name: "Agregar miembro" })).toHaveLength(1);
  });

  test("muestra cuando se actualizo la lista", () => {
    const { getByText } = renderTeam();
    expect(getByText("Última actualización: 8 nov 2026 · 11:05")).toBeTruthy();
  });

  test("explica el alcance de cada rol", () => {
    const { getByText } = renderTeam();
    expect(
      getByText("Revisa reportes, aplica sanciones, consulta la bitácora y gestiona los roles del equipo."),
    ).toBeTruthy();
    expect(
      getByText(
        "Revisa evidencia y resuelve reportes. No puede modificar el equipo ni los permisos de otros miembros.",
      ),
    ).toBeTruthy();
  });
});
