import { render } from "@testing-library/react-native";
import { Text } from "react-native";

import { PageHeader } from "@/components/layout/PageHeader";

describe("<PageHeader />", () => {
  test("muestra la ruta, el titulo y las acciones de la pagina", () => {
    const { getByText, getByRole } = render(
      <PageHeader breadcrumb="Moderación / Reportes" title="Reportes">
        <Text>23 abiertos</Text>
      </PageHeader>,
    );
    expect(getByText("Moderación / Reportes")).toBeTruthy();
    expect(getByText("Reportes")).toBeTruthy();
    expect(getByText("23 abiertos")).toBeTruthy();
    expect(getByRole("button", { name: "Cambiar tema" })).toBeTruthy();
  });
});
