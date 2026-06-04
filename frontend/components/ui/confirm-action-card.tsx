import React from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

interface ConfirmActionCardProps {
  title: string;
  message: string | string[];
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
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const accentColor = destructive ? "#D4183D" : "#30C2D9";
  const darkAccentColor = destructive ? "#82181A" : "#30C2D9";
  const confirmBg = destructive && isDark ? "#82181A" : accentColor;
  const iconBg = destructive
    ? isDark
      ? "#D4183D1A"
      : "#D4183D1A"
    : isDark
      ? "#30C2D933"
      : "#30C2D91A";
  const messageLines = Array.isArray(message) ? message : [message];

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: 15,
        stiffness: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacityAnim, scaleAnim]);

  return (
    <Animated.View
      style={{ opacity: opacityAnim }}
      className="flex-1 items-center justify-center bg-black/50"
    >
      <Animated.View
        style={{ transform: [{ scale: scaleAnim }] }}
        className="flex h-[33%] w-[90%] justify-center self-center rounded-3xl border border-[#e6e6e6] bg-background-light dark:border-[#404b65] dark:bg-[#1F2B4A]"
      >
        <View
          className="mb-4 h-20 w-20 items-center justify-center self-center rounded-full"
          style={{ backgroundColor: iconBg }}
        >
          <Ionicons
            name={iconName}
            size={32}
            color={isDark ? darkAccentColor : accentColor}
            className="justify-center self-center"
          />
        </View>

        <Text className="mb-2 text-center font-spartan-bold text-xl text-[#2C2C2C] dark:text-background-light">
          {title}
        </Text>
        {messageLines.map((line, index) => (
          <Text
            key={line}
            className="text-center font-spartan text-lg text-[#6B6B6B] dark:text-[#A0A0A0]"
            style={{
              marginBottom: index === messageLines.length - 1 ? 16 : 0,
            }}
          >
            {line}
          </Text>
        ))}

        <View className="flex-row justify-center">
          <Pressable
            className="mr-2 w-[40%] rounded-xl bg-[#E0E0E0] p-3 px-4 dark:bg-[#2A3654]"
            disabled={loading}
            onPress={onCancel}
          >
            <Text className="text-center font-spartan text-lg text-[#2C2C2C] dark:text-[#F0F0F0]">
              {cancelText}
            </Text>
          </Pressable>

          <Pressable
            className="ml-2 w-[40%] rounded-xl p-3 px-4"
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
      </Animated.View>
    </Animated.View>
  );
}
