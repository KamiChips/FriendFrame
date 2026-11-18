import { render } from "@testing-library/react-native";

import { Chip } from "@/components/ui/Chip";

describe("<Chip />", () => {
  test("muestra la etiqueta recibida", () => {
    const { getByText } = render(<Chip label="Pendiente" />);
    expect(getByText("Pendiente")).toBeTruthy();
  });
});
