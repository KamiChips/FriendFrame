import { router } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { useTheme } from "@/hooks/use-theme";

export interface ScreenStateProps {
  // sin error ni notFound se muestra la carga
  error?: Error | null;
  notFound?: boolean;
  onRetry?: () => void;
}

// pantalla completa para carga, error o registro inexistente
export function ScreenState({ error, notFound, onRetry }: ScreenStateProps) {
  const { colors } = useTheme();

  return (
    <View className="min-h-screen flex-1 items-center justify-center gap-4 bg-canvas-light dark:bg-canvas-dark">
      {notFound ? (
        <>
          <Text className="font-spartan text-base leading-[19px] text-muted-light dark:text-muted-dark">
            No encontramos lo que buscas.
          </Text>
          <Button label="Ir al dashboard" onPress={() => router.replace("/dashboard")} />
        </>
      ) : error ? (
        <>
          <Text className="font-spartan text-base leading-[19px] text-muted-light dark:text-muted-dark">
            No se pudo cargar la información.
          </Text>
          {onRetry && <Button label="Reintentar" onPress={onRetry} />}
        </>
      ) : (
        <ActivityIndicator accessibilityLabel="Cargando" color={colors.accent} />
      )}
    </View>
  );
}
