import { Pressable, Text, View } from "react-native";

export interface SwitchProps {
  label: string;
  value: boolean;
  onValueChange?: (value: boolean) => void;
}

export function Switch({ label, value, onValueChange }: SwitchProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange?.(!value)}
      className="flex-row items-center gap-[10px]"
    >
      <View
        className={`h-[22px] w-[38px] justify-center rounded-full px-[3px] ${value ? "items-end bg-[#30C2D9] dark:bg-[#AA3E14]" : "items-start bg-line-light dark:bg-line-dark"}`}
      >
        <View className="h-4 w-4 rounded-full bg-white" />
      </View>
      <Text className="font-spartan text-sm leading-[17px] text-ink-light dark:text-ink-dark">
        {label}
      </Text>
    </Pressable>
  );
}
