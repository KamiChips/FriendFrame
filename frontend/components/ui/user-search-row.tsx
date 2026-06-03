import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface UserSearchRowProps {
  name: string;
  username: string;
  initials: string;
  onPress?: () => void;
}

export default function UserSearchRow({ name, username, initials, onPress }: UserSearchRowProps) {
  const isDark = useColorScheme() === 'dark';

  // Gradiente idéntico al mockup (Naranja quemado a Azul oscuro)
const gradientColors = isDark 
  ? ["#AA3E14", "#115A67"] as const 
  : ["#FF9B42", "#30C2D9"] as const;

  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.7}
      // Fondo oscuro y borde idéntico al diseño de Figma
      className="flex-row items-center border border-gray-300 dark:border-[#2A3654] bg-white dark:bg-[#1D2A4F] rounded-2xl p-4 mb-3"
    >
      {/* Avatar con Gradiente */}
      <LinearGradient 
        colors={gradientColors}
        style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }}
      >
        <Text className="text-white text-base font-spartan-bold">{initials}</Text>
      </LinearGradient>

      {/* Información del Usuario */}
      <View className="ml-4 flex-1">
        <Text className="font-spartan-bold text-base text-black dark:text-white mb-0.5">
          {name}
        </Text>
        <Text className="font-spartan text-sm text-gray-500 dark:text-gray-400">
          {username}
        </Text>
      </View>
    </TouchableOpacity>
  );
}