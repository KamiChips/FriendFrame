import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "friendframe-admin/theme";

// la fuente de verdad es la clase "dark" del <html>; index.html la pone antes de pintar
function readTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // sin almacenamiento el tema solo dura la sesion
  }
  listeners.forEach((listener) => listener());
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light" as const);
  const toggleTheme = useCallback(() => setTheme(theme === "dark" ? "light" : "dark"), [theme]);
  return { theme, isDark: theme === "dark", toggleTheme };
}
