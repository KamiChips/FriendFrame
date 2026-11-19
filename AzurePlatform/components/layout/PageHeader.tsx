import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { ThemeSelector } from "@/components/ui/ThemeSelector";

export interface PageHeaderProps {
  breadcrumb: string;
  title: string;
  // acciones propias de la pagina; van antes del selector de tema
  children?: ReactNode;
}

export function PageHeader({ breadcrumb, title, children }: PageHeaderProps) {
  return (
    <View className="h-28 flex-row items-center justify-between border-b border-line-light bg-surface-light px-8 dark:border-line-dark dark:bg-surface-dark">
      <View className="gap-[7px]">
        <Text className="font-spartan text-[13px] leading-4 text-muted-light dark:text-muted-dark">
          {breadcrumb}
        </Text>
        <Text
          accessibilityRole="header"
          className="font-spartan-bold text-[30px] leading-9 text-ink-light dark:text-ink-dark"
        >
          {title}
        </Text>
      </View>
      <View className="flex-row items-center gap-4">
        {children}
        <ThemeSelector variant="pill" />
      </View>
    </View>
  );
}
