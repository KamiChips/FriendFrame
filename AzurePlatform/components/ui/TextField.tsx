import { useState } from "react";
import { Pressable, Text, TextInput, type TextInputProps, View } from "react-native";

import { useTheme } from "@/hooks/use-theme";

import { Icon } from "./Icon";

export interface TextFieldProps extends Omit<TextInputProps, "style"> {
  label: string;
  // mensaje bajo el campo; tambien pinta el borde de rojo
  error?: string;
}

export function TextField({ label, error, secureTextEntry, ...inputProps }: TextFieldProps) {
  const { colors } = useTheme();
  // solo aplica a campos de contrasena
  const [isHidden, setIsHidden] = useState(true);

  return (
    <View className="w-full gap-1.5">
      <View
        className={`h-[62px] w-full gap-[7px] rounded-t-lg border-b-2 bg-soft-light px-3 py-[9px] dark:bg-soft-dark ${error ? "border-danger-light dark:border-danger-dark" : "border-line-light dark:border-line-dark"}`}
      >
        <Text className="font-spartan text-xs leading-[14px] text-muted-light dark:text-muted-dark">
          {label}
        </Text>
        <View className="flex-row items-center justify-between">
          <TextInput
            {...inputProps}
            accessibilityLabel={label}
            secureTextEntry={secureTextEntry ? isHidden : false}
            placeholderTextColor={colors.muted}
            className="flex-1 font-spartan text-[17px] leading-5 text-ink-light outline-none dark:text-ink-dark"
          />
          {secureTextEntry && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isHidden ? "Mostrar contraseña" : "Ocultar contraseña"}
              onPress={() => setIsHidden((hidden) => !hidden)}
            >
              <Icon name={isHidden ? "eye-off" : "eye"} size={18} tone="muted" />
            </Pressable>
          )}
        </View>
      </View>
      {error && (
        <Text className="font-spartan text-[13px] leading-4 text-danger-light dark:text-danger-dark">
          {error}
        </Text>
      )}
    </View>
  );
}
