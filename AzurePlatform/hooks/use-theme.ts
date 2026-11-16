import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import { Appearance } from "react-native";

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

// aplica el tema guardado al abrir la app; sin eleccion guardada sigue al sistema.
// se aplica siempre de forma explicita para que la clase "dark" coincida con los colores de los iconos
export function useRestoreTheme() {
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    const system = Appearance.getColorScheme() === "dark" ? "dark" : "light";
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => setColorScheme(saved === "light" || saved === "dark" ? saved : system))
      .catch(() => setColorScheme(system));
  }, [setColorScheme]);
}
