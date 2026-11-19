import { Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";

export interface StatePanelProps {
  icon?: IconName;
  title: string;
  description: string;
  // accion de texto con flecha, como reintentar
  actionLabel?: string;
  onAction?: () => void;
}

// tarjeta que reemplaza una lista vacia o que no pudo cargarse
export function StatePanel({ icon, title, description, actionLabel, onAction }: StatePanelProps) {
  return (
    <View className="min-h-[440px] items-center gap-5 overflow-hidden rounded-2xl bg-surface-light px-10 py-16 dark:bg-surface-dark">
      {icon && <Icon name={icon} size={64} tone="accent" />}
      <Text className="text-center font-spartan-bold text-[28px] leading-[34px] text-ink-light dark:text-ink-dark">
        {title}
      </Text>
      <Text className="w-[700px] max-w-full text-center font-spartan text-base leading-[19px] text-muted-light dark:text-muted-dark">
        {description}
      </Text>
      {actionLabel && (
        <Button label={actionLabel} variant="ghost" icon="arrow-left" onPress={onAction} />
      )}
    </View>
  );
}
