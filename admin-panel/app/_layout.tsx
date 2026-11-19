import "../global.css";

import { useFonts } from "expo-font";
import { type ErrorBoundaryProps, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { ScreenState } from "@/components/layout/ScreenState";
import { ToastProvider } from "@/hooks/use-toast";
import { useRestoreTheme } from "@/hooks/use-theme";

// cualquier error no previsto en una ruta muestra la pagina de error inesperado con la opcion de recargar
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return <ScreenState error={error} onRetry={retry} />;
}

export default function RootLayout() {
  useRestoreTheme();
  const [fontsLoaded, fontError] = useFonts({
    "LeagueSpartan-Regular": require("../assets/fonts/LeagueSpartan-Regular.ttf"),
    "LeagueSpartan-Bold": require("../assets/fonts/LeagueSpartan-Bold.ttf"),
    "Borel-regular": require("../assets/fonts/Borel-Regular.ttf"),
  });

  // se espera a las fuentes para no pintar texto con la fuente del sistema
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ToastProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </ToastProvider>
  );
}
