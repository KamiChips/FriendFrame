import { Text, View } from "react-native";

import { Button } from "@/components/ui/Button";

export interface ErrorMessageProps {
  // texto grande de acento, como el codigo del error
  code: string;
  title: string;
  description: string;
  actionLabel: string;
  onAction?: () => void;
}

// mensaje de error de pagina completa dentro del area de trabajo
export function ErrorMessage({ code, title, description, actionLabel, onAction }: ErrorMessageProps) {
  return (
    <View className="items-center gap-6 py-[100px]">
      <Text className="font-spartan-bold text-[92px] leading-[110px] text-accent-light dark:text-accent-dark">
        {code}
      </Text>
      <Text className="text-center font-spartan-bold text-[32px] leading-[38px] text-ink-light dark:text-ink-dark">
        {title}
      </Text>
      <Text className="text-center font-spartan text-[17px] leading-5 text-muted-light dark:text-muted-dark">
        {description}
      </Text>
      <View className="w-[210px]">
        <Button label={actionLabel} variant="primary" fullWidth onPress={onAction} />
      </View>
    </View>
  );
}
