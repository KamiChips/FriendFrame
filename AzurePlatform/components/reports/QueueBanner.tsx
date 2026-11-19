import { Pressable, Text, View } from "react-native";

import { Icon } from "@/components/ui/Icon";

export interface QueueBannerProps {
  // reportes nuevos o resultado de la ultima accion, ya redactado
  message: string;
  onPress?: () => void;
}

// aviso de cambios en la cola: reportes que llegaron o reportes que se cerraron
export function QueueBanner({ message, onPress }: QueueBannerProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={message}
      onPress={onPress}
      className="h-10 flex-row items-center gap-[10px] rounded-[10px] bg-warnSoft-light px-4 dark:bg-warnSoft-dark"
    >
      <Icon name="refresh-cw" size={17} tone="onWarnSoft" />
      <Text className="font-spartan text-[15px] leading-[18px] text-onWarnSoft-light dark:text-onWarnSoft-dark">
        {message}
      </Text>
      <View className="flex-1" />
      <Icon name="arrow-right" size={17} tone="onWarnSoft" />
    </Pressable>
  );
}
