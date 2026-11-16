import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";

import { palette } from "@/constants/palette";

const STORAGE_KEY = "azure-platform/theme";

// tema activo, sus colores y como alternarlo; la eleccion se guarda en el dispositivo
export function useTheme() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";
    setColorScheme(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      // sin almacenamiento el tema solo dura la sesion
    });
  };

  return {
    isDark,
    colors: isDark ? palette.dark : palette.light,
    toggleTheme,
  };
}

// aplica el tema guardado al abrir la app
export function useRestoreTheme() {
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === "light" || saved === "dark") setColorScheme(saved);
      })
      .catch(() => {});
  }, [setColorScheme]);
}
