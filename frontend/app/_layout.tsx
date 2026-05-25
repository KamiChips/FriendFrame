import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import SplashScreen from '@/components/ui/SplashScreen'; 
import { useFonts } from 'expo-font'; // <-- Importamos useFonts

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
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
    }, 8000);

    return () => clearTimeout(timer);
  }, [fontsLoaded, fontError]); // Agregamos las fuentes a las dependencias

  // Mostramos splash mientras la app "carga" o mientras las fuentes no estén listas
  if (!appIsReady || (!fontsLoaded && !fontError)) {
    return <SplashScreen />;
  }

  // cuando carga, renderizamos la navegación de los temas
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        
        {/* Pantalla de Crear Grupo */}
        <Stack.Screen 
          name="CreateGroup" 
          options={{ 
            presentation: 'transparentModal', 
            headerShown: false,
            animation: 'slide_from_bottom' 
          }} 
        />
        
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}