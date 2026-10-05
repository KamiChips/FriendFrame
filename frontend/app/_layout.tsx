import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Button, StyleSheet, Text, View } from "react-native";
import "react-native-reanimated";
import { useEffect, useState } from "react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import SplashScreen from "@/components/ui/SplashScreen";
import { useFonts } from "expo-font"; // <-- Importamos useFonts
import { AuthProvider } from "@/context/AuthContext";
import { RouteGuard } from "@/navigation/RouteGuard";
import { NotificationsBadgeProvider } from "@/context/NotificationContext";
import { ChatBadgeProvider } from "@/context/ChatContext";
import { initSentry, Sentry } from "@/lib/sentry/sentry";

// Se ejecuta antes del primer render y solo es una vez al cargar el modulo
initSentry();

type ErrorFallbackProps = {
  error: unknown;
  resetError: () => void;
};

function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Algo salió mal</Text>
      <Text style={styles.errorMessage}>
        {__DEV__ && error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado. Intenta de nuevo."}
      </Text>
      <Button title="Reintentar" onPress={resetError} />
    </View>
  );
}

export const unstable_settings = {
    anchor: '(tabs)',
};

function RootLayout() {
  const colorScheme = useColorScheme();
  const [appIsReady, setAppIsReady] = useState(false);

    const [fontsLoaded, fontError] = useFonts({
        'LeagueSpartan-Regular': require('../assets/fonts/LeagueSpartan-Regular.ttf'),
        'LeagueSpartan-Bold': require('../assets/fonts/LeagueSpartan-Bold.ttf'),
        'Borel-regular': require('../assets/fonts/Borel-Regular.ttf'), // Verifica que el archivo .ttf se llame así
    });

    useEffect(() => {
        // Simulador de carga
        const timer = setTimeout(() => {
            // Solo indicamos que la app está lista si las fuentes ya cargaron
            if (fontsLoaded || fontError) {
                setAppIsReady(true);
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [fontsLoaded, fontError]); // Agregamos las fuentes a las dependencias

    // Mostramos splash mientras la app "carga" o mientras las fuentes no estén listas
    if (!appIsReady || (!fontsLoaded && !fontError)) {
        return <SplashScreen />;
    }

  // cuando carga, renderizamos la navegación de los temas
  return (
    // Error Boundary envuelve a todos los providers por lo que se pone al inicio
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <ErrorFallback error={error} resetError={resetError} />
      )}
    >
      <AuthProvider>
        <NotificationsBadgeProvider>
          <ChatBadgeProvider>
            <RouteGuard />
            <ThemeProvider
              value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
            >
              <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="NotificationInbox"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="ChatScreen"
                  options={{ headerShown: false }}
                />
                <Stack.Screen name="Settings" options={{ headerShown: false }} />
                <Stack.Screen
                  name="modal"
                  options={{ presentation: "modal", title: "Modal" }}
                />

                {/* Pantalla de Crear Grupo */}
                <Stack.Screen
                  name="CreateGroup"
                  options={{
                    presentation: "transparentModal",
                    headerShown: false,
                    animation: "slide_from_bottom",
                  }}
                />
              </Stack>
              <StatusBar style="auto" />
            </ThemeProvider>
          </ChatBadgeProvider>
        </NotificationsBadgeProvider>
      </AuthProvider>
    </Sentry.ErrorBoundary>
  );
}

// wrap() agrega tracking de touch events y performance a nivel app
export default Sentry.wrap(RootLayout);

// Fallback usa estilos y colores fijos (fuera de ThemeProvider)
const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  errorTitle: { fontSize: 20, fontWeight: "600" },
  errorMessage: { textAlign: "center", opacity: 0.7 },
});