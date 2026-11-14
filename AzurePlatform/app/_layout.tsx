import "../global.css";

import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { useRestoreTheme } from "@/hooks/use-theme";

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
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </>
  );
}
