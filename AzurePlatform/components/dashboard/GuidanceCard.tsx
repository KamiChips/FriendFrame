import { Pressable, Text } from "react-native";

import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

export interface GuidanceCardProps {
  onOpenGuide?: () => void;
}

// recordatorio fijo del criterio de moderacion
export function GuidanceCard({ onOpenGuide }: GuidanceCardProps) {
  return (
    <Card className="min-w-0 gap-3 p-[22px]">
      <Icon name="heart-handshake" size={28} tone="accent" />
      <Text className="font-spartan-bold text-xl leading-6 text-ink-light dark:text-ink-dark">
        Primero, el contexto.
      </Text>
      <Text className="font-spartan text-[15px] leading-[18px] text-muted-light dark:text-muted-dark">
        Revisa quién publica y en qué perfil aparece el contenido antes de tomar una decisión.
      </Text>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Consultar guía de moderación"
        onPress={onOpenGuide}
        className="self-start"
      >
        <Text className="font-spartan text-sm leading-[17px] text-link-light dark:text-link-dark">
          Consultar guía de moderación ↗
        </Text>
      </Pressable>
    </Card>
  );
}
