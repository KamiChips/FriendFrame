import { useColorScheme } from "nativewind";

import { palette } from "@/constants/palette";

// tema activo, sus colores y como alternarlo
export function useTheme() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return {
    isDark,
    colors: isDark ? palette.dark : palette.light,
    toggleTheme: toggleColorScheme,
  };
}
