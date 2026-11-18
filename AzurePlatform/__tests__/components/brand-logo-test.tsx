import { render } from "@testing-library/react-native";

import { BrandLogo } from "@/components/ui/BrandLogo";

describe("<BrandLogo />", () => {
  test("muestra el nombre de la marca", () => {
    const { getByText } = render(<BrandLogo size={40} />);
    expect(getByText("FriendFrame")).toBeTruthy();
  });
});
