import { Pressable, Text } from "react-native";

import { Icon } from "./Icon";

export interface SelectFieldProps {
  // sin etiqueta solo se muestra el valor
  label?: string;
  // valor elegido; con etiqueta se muestra como "{label}: {value}"
  value: string;
  width?: number;
  // abrir las opciones queda a cargo de quien usa el componente
  onPress?: () => void;
}

export function SelectField({ label, value, width, onPress }: SelectFieldProps) {
  const text = label ? `${label}: ${value}` : value;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={text}
      onPress={onPress}
      style={width === undefined ? undefined : { width }}
      className="h-11 flex-row items-center justify-between gap-2 rounded-xl border border-line-light bg-surface-light px-[14px] dark:border-line-dark dark:bg-surface-dark"
    >
      <Text
        numberOfLines={1}
        className="font-spartan text-[15px] leading-[18px] text-ink-light dark:text-ink-dark"
      >
        {text}
      </Text>
      <Icon name="chevron-down" size={16} tone="muted" />
    </Pressable>
  );
}
