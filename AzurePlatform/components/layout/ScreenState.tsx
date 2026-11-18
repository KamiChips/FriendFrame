import { ActivityIndicator, View } from "react-native";

import { errorPages } from "@/constants/feedback";
import { useTheme } from "@/hooks/use-theme";

import { ErrorMessage } from "./ErrorMessage";

export interface ScreenStateProps {
  // sin error se muestra la carga
  error?: Error | null;
  onRetry?: () => void;
}

// pantalla completa para cuando todavia no hay navegacion que mostrar: carga o error inesperado
export function ScreenState({ error, onRetry }: ScreenStateProps) {
  const { colors } = useTheme();
  const page = errorPages.unexpected;

  return (
    <View className="min-h-screen flex-1 items-center justify-center bg-canvas-light dark:bg-canvas-dark">
      {error ? (
        <ErrorMessage
          code={page.code}
          title={page.heading}
          description={page.description}
          actionLabel={page.actionLabel}
          onAction={onRetry}
        />
      ) : (
        <ActivityIndicator accessibilityLabel="Cargando" color={colors.accent} />
      )}
    </View>
  );
}
