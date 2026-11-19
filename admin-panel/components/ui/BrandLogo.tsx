import { Platform, Text, type TextStyle } from "react-native";

import { useTheme } from "@/hooks/use-theme";

const BRAND_NAME = "FriendFrame";

export interface BrandLogoProps {
  // tamano de letra en px
  size: number;
}

export function BrandLogo({ size }: BrandLogoProps) {
  const { isDark, colors } = useTheme();
  const [from, to] = isDark ? ["#AA3E14", "#115A67"] : ["#30C2D9", "#FF9B42"];

  // el degradado recortado al texto solo existe en web; en nativo se usa el color de acento
  const fill = Platform.select<TextStyle>({
    web: {
      backgroundImage: `linear-gradient(to right, ${from}, ${to})`,
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      color: "transparent",
    } as TextStyle,
    default: { color: colors.accent },
  });

  return (
    <Text
      accessibilityRole="header"
      className="self-start font-borel"
      style={[{ fontSize: size, lineHeight: size * 1.8 }, fill]}
    >
      {BRAND_NAME}
    </Text>
  );
}
