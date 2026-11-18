import { Text, TextInput, View } from "react-native";

import { useTheme } from "@/hooks/use-theme";

export interface NotesFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  // agrega "· obligatorio" a la etiqueta
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
}

// area de notas internas con contador de caracteres, como en las confirmaciones
export function NotesField({
  value,
  onChangeText,
  required = false,
  placeholder = "Escribe el motivo de la decisión",
  maxLength = 500,
}: NotesFieldProps) {
  const { colors } = useTheme();

  return (
    <View className="w-full gap-1.5">
      <View className="min-h-[76px] w-full gap-2 border-b-2 border-line-light bg-soft-light p-3 dark:border-line-dark dark:bg-soft-dark">
        <Text className="font-spartan text-xs leading-[14px] text-muted-light dark:text-muted-dark">
          Notas internas{required ? " · obligatorio" : ""}
        </Text>
        <TextInput
          accessibilityLabel="Notas internas"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          maxLength={maxLength}
          multiline
          className="font-spartan text-[15px] leading-[18px] text-ink-light outline-none dark:text-ink-dark"
        />
      </View>
      <Text className="text-right font-spartan text-xs leading-[14px] text-muted-light dark:text-muted-dark">
        {value.length} / {maxLength}
      </Text>
    </View>
  );
}
