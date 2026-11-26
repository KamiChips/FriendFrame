import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

import { Icon } from "./Icon";

export interface ThemeToggleProps {
  // "plain" solo icono y nombre (login); "pill" con borde (cabecera)
  variant?: "plain" | "pill";
}

export function ThemeToggle({ variant = "plain" }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();
  const isPill = variant === "pill";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`${isDark ? "Dark" : "Light"} theme. Change theme`}
      className={cn(
        "flex items-center gap-2 rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        isPill ? "h-9 border border-line px-3 text-[13px] hover:bg-soft" : "text-sm",
      )}
    >
      <Icon name={isDark ? "moon" : "sun"} size={isPill ? 16 : 18} className="text-brand" />
      {isDark ? "Dark" : "Light"}
    </button>
  );
}
