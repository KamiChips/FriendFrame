import { Pressable, Text } from "react-native";

import { useTheme } from "@/hooks/use-theme";

import { Icon } from "./Icon";

export interface ThemeSelectorProps {
  // "plain" solo icono y nombre (login); "pill" con borde y flecha (cabecera)
  variant?: "plain" | "pill";
}

export function ThemeSelector({ variant = "plain" }: ThemeSelectorProps) {
  const { isDark, toggleTheme } = useTheme();
  const isPill = variant === "pill";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Cambiar tema"
      onPress={toggleTheme}
      className={
        isPill
          ? "h-9 flex-row items-center gap-[7px] rounded-full border border-line-light px-3 dark:border-line-dark"
          : "flex-row items-center gap-2"
      }
    >
      <Icon name={isDark ? "moon" : "sun"} size={isPill ? 16 : 18} tone="accent" />
      <Text
        className={`font-spartan text-ink-light dark:text-ink-dark ${isPill ? "text-[13px] leading-4" : "text-sm leading-[17px]"}`}
      >
        {isDark ? "Oscuro" : "Claro"}
      </Text>
      {isPill && <Icon name="chevron-down" size={13} tone="muted" />}
    </Pressable>
  );
}
