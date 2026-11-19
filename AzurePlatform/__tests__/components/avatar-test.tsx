import { render } from "@testing-library/react-native";

import { Avatar } from "@/components/ui/Avatar";

describe("<Avatar />", () => {
  test("muestra las iniciales cuando no hay foto", () => {
    const { getByText, queryByTestId } = render(<Avatar initials="LF" />);
    expect(getByText("LF")).toBeTruthy();
    expect(queryByTestId("avatar-image")).toBeNull();
  });

  test("muestra la foto cuando se recibe", () => {
    const { getByTestId, queryByText } = render(
      <Avatar initials="CD" imageUrl="https://example.test/carlos.png" />,
    );
    expect(getByTestId("avatar-image").props.source).toEqual({
      uri: "https://example.test/carlos.png",
    });
    expect(queryByText("CD")).toBeNull();
  });
});
