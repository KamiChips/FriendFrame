import { fireEvent, render } from "@testing-library/react-native";

import { suspendedProfile } from "@/fixtures/users";
import { UserProfileScreen } from "@/screens/UserProfileScreen";
import type { UserProfile } from "@/types/moderation";

import { buildShell } from "../fixtures/shell";

const activeProfile: UserProfile = {
  ...suspendedProfile,
  status: "active",
  activeSanction: null,
};

function renderProfile(overrides = {}) {
  return render(
    <UserProfileScreen shell={buildShell()} profile={suspendedProfile} {...overrides} />,
  );
}

describe("<UserProfileScreen />", () => {
  test("identifica la cuenta en la cabecera y en la tarjeta", () => {
    const { getByText, getByRole } = renderProfile();
    expect(getByText("Moderación / Usuarios / @carlos_dev")).toBeTruthy();
    expect(getByRole("header", { name: "@carlos_dev" })).toBeTruthy();
    expect(getByText("Carlos Méndez")).toBeTruthy();
    expect(getByText("Miembro desde el 1 nov 2026")).toBeTruthy();
  });

  test("explica la sancion vigente y quien la aplico", () => {
    const { getByText } = renderProfile();
    expect(getByText("Suspendida hasta 15 nov")).toBeTruthy();
    expect(getByText("Aplicada por @admin · 8 nov 2026")).toBeTruthy();
  });

  test("avisa al pedir el reporte que origino la sancion", () => {
    const onOpenReport = jest.fn();
    const { getByRole } = renderProfile({ onOpenReport });
    fireEvent.press(getByRole("link", { name: "Reporte FF-1048" }));
    expect(onOpenReport).toHaveBeenCalledWith("r1");
  });

  test("muestra los contadores recibidos", () => {
    const { getByText } = renderProfile();
    expect(getByText("Reportes recibidos")).toBeTruthy();
    expect(getByText("6")).toBeTruthy();
    expect(getByText("3 contenidos distintos")).toBeTruthy();
    expect(getByText("Sanciones")).toBeTruthy();
  });

  test("lista los eventos de moderacion con su contexto", () => {
    const { getByText } = renderProfile();
    expect(getByText("Suspensión de 7 días")).toBeTruthy();
    expect(getByText("8 nov 2026 · 11:02")).toBeTruthy();
    expect(getByText("@admin · FF-1048 · Acoso reiterado")).toBeTruthy();
    expect(getByText("@moderador2 · FF-0984")).toBeTruthy();
  });

  test("indica cuanto contenido oculto hay y avisa al cambiar de pestana", () => {
    const onChangeTab = jest.fn();
    const { getByRole } = renderProfile({ onChangeTab });
    fireEvent.press(getByRole("tab", { name: "Contenido oculto (2)" }));
    expect(onChangeTab).toHaveBeenCalledWith("hidden");
  });

  test("marca la pestana activa", () => {
    const { getByRole } = renderProfile({ activeTab: "hidden" });
    expect(getByRole("tab", { name: "Contenido oculto (2)" }).props.accessibilityState.selected).toBe(true);
    expect(getByRole("tab", { name: "Línea de tiempo" }).props.accessibilityState.selected).toBe(false);
  });

  test("restaura una cuenta sancionada solo con notas", () => {
    const onRestoreAccount = jest.fn();
    const { getByRole, getByText, getByLabelText } = renderProfile({ onRestoreAccount });
    expect(getByText("Antes de restaurar")).toBeTruthy();
    fireEvent.press(getByRole("button", { name: "Restaurar cuenta" }));
    expect(getByText("Restaurar a @carlos_dev")).toBeTruthy();

    fireEvent.press(getByRole("button", { name: "Restaurar" }));
    expect(onRestoreAccount).not.toHaveBeenCalled();

    fireEvent.changeText(getByLabelText("Notas internas"), "Apelación revisada");
    fireEvent.press(getByRole("button", { name: "Restaurar" }));
    expect(onRestoreAccount).toHaveBeenCalledWith("Apelación revisada");
  });

  test("una cuenta activa no se puede restaurar", () => {
    const { getByRole, queryByRole, queryByText, getByText } = renderProfile({
      profile: activeProfile,
    });
    expect(getByText("Activa")).toBeTruthy();
    expect(queryByRole("button", { name: "Restaurar cuenta" })).toBeNull();
    expect(getByRole("button", { name: "Cuenta activa" }).props.accessibilityState.disabled).toBe(
      true,
    );
    expect(queryByText("Antes de restaurar")).toBeNull();
  });

  test("lista el contenido oculto y permite restaurarlo", () => {
    const onRestoreContent = jest.fn();
    const { getByText, getAllByRole } = renderProfile({ activeTab: "hidden", onRestoreContent });
    expect(getByText("Post · FF-1048")).toBeTruthy();
    expect(getByText("En el perfil de @ana.rmz")).toBeTruthy();
    expect(getByText("Oculto · 8 nov 2026")).toBeTruthy();
    fireEvent.press(getAllByRole("button", { name: "Restaurar" })[0]);
    expect(onRestoreContent).toHaveBeenCalledWith("h1");
  });

  test("avisa al pedir los reportes de la cuenta", () => {
    const onViewReports = jest.fn();
    const { getByRole } = renderProfile({ onViewReports });
    fireEvent.press(getByRole("link", { name: "Ver reportes de @carlos_dev" }));
    expect(onViewReports).toHaveBeenCalledTimes(1);
  });
});
