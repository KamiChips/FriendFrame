import React from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

interface ConfirmActionCardProps {
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  iconName: IconName;
  loading?: boolean;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmActionCard({
  title,
  message,
  confirmText,
  cancelText = "Cancelar",
  iconName,
  loading = false,
  destructive = false,
  onCancel,
  onConfirm,
}: ConfirmActionCardProps) {
  const isDark = useColorScheme() === "dark";
  const accentColor = destructive ? "#D4183D" : "#30C2D9";
  const darkAccentColor = destructive ? "#F87171" : "#30C2D9";
  const confirmBg = destructive && isDark ? "#82181A" : accentColor;
  const iconBg = destructive
    ? isDark
      ? "rgba(239, 68, 68, 0.2)"
      : "rgba(212, 24, 61, 0.1)"
    : isDark
      ? "rgba(48, 194, 217, 0.2)"
      : "rgba(48, 194, 217, 0.1)";

  return (
    <View className="flex-1 items-center justify-center bg-black/40 px-6">
      <View className="w-full rounded-3xl border border-[#e6e6e6] bg-background-light px-6 py-7 shadow-lg dark:border-[#404b65] dark:bg-[#1F2B4A]">
        <View
          className="mb-4 h-20 w-20 items-center justify-center self-center rounded-full"
          style={{ backgroundColor: iconBg }}
        >
          <Ionicons
            name={iconName}
            size={34}
            color={isDark ? darkAccentColor : accentColor}
          />
        </View>

        <Text className="mb-2 text-center font-spartan-bold text-xl text-[#2C2C2C] dark:text-background-light">
          {title}
        </Text>
        <Text className="mb-6 text-center font-spartan text-base leading-6 text-[#6B6B6B] dark:text-[#A0A0A0]">
          {message}
        </Text>

        <View className="flex-row justify-center">
          <Pressable
            className="mr-2 w-[42%] rounded-xl bg-[#E0E0E0] p-3 dark:bg-[#2A3654]"
            disabled={loading}
            onPress={onCancel}
          >
            <Text className="text-center font-spartan text-lg text-[#2C2C2C] dark:text-[#F0F0F0]">
              {cancelText}
            </Text>
          </Pressable>

          <Pressable
            className="ml-2 w-[42%] rounded-xl p-3"
            disabled={loading}
            onPress={onConfirm}
            style={{ backgroundColor: confirmBg }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-center font-spartan-bold text-lg text-white">
                {confirmText}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}
