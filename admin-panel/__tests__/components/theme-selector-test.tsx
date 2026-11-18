import { act, fireEvent, render } from "@testing-library/react-native";
import { colorScheme } from "nativewind";

import { ThemeSelector } from "@/components/ui/ThemeSelector";

describe("<ThemeSelector />", () => {
  afterEach(() => {
    act(() => colorScheme.set("light"));
  });

  test("indica el tema claro", () => {
    const { getByText, getByTestId } = render(<ThemeSelector />);
    expect(getByText("Claro")).toBeTruthy();
    expect(getByTestId("icon-sun")).toBeTruthy();
  });

  test("cambia al tema oscuro al presionarlo", () => {
    const { getByRole, getByText, getByTestId } = render(<ThemeSelector />);
    fireEvent.press(getByRole("button"));
    expect(getByText("Oscuro")).toBeTruthy();
    expect(getByTestId("icon-moon")).toBeTruthy();
  });
});
