import { Pressable, Text, View } from "react-native";

import { Icon } from "@/components/ui/Icon";

export interface NewReportsBannerProps {
  count: number;
  onPress?: () => void;
}

// aviso de reportes llegados despues de cargar la cola; no se muestra si no hay
export function NewReportsBanner({ count, onPress }: NewReportsBannerProps) {
  if (count <= 0) return null;

  const text = `${count} ${count === 1 ? "reporte nuevo" : "reportes nuevos"} — clic para ver`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={text}
      onPress={onPress}
      className="h-10 flex-row items-center gap-[10px] rounded-[10px] bg-warnSoft-light px-4 dark:bg-warnSoft-dark"
    >
      <Icon name="refresh-cw" size={17} tone="onWarnSoft" />
      <Text className="font-spartan text-[15px] leading-[18px] text-onWarnSoft-light dark:text-onWarnSoft-dark">
        {text}
      </Text>
      <View className="flex-1" />
      <Icon name="arrow-right" size={17} tone="onWarnSoft" />
    </Pressable>
  );
}
