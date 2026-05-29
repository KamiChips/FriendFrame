import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

interface SelectableUserRowProps {
  name: string;
  username: string;
  avatarSource: any;
  isSelected: boolean;
  onToggle: () => void;
}

export default function SelectableUserRow({
  name,
  username,
  avatarSource,
  isSelected,
  onToggle
}: SelectableUserRowProps) {
  // Obtenemos el esquema de color actual para saber si es Dark Mode
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Definimos el color activo: Naranja para oscuro, Azul para claro
  const activeColor = isDark ? "#FF9B42" : "#30C2D9";

  return (
    <TouchableOpacity 
      onPress={onToggle}
      // El borde y fondo cambian si está seleccionado o no
      className={`flex-row items-center justify-between mb-4 rounded-xl p-2 ${
        isSelected 
          ? 'border border-[#30C2D9] dark:border-[#FF9B42] bg-white dark:bg-[#1C1C24]' 
          : 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent'
      }`}
    >
      <View className="flex-row items-center">
        {/* Avatar forzado para evitar colapso */}
        <Image
          source={avatarSource}
          style={{ width: 48, height: 48, borderRadius: 24 }}
          contentFit="cover"
        />
        <View className="ml-3">
          <Text className="font-spartan-bold text-base text-background-dark dark:text-background-light">
            {name}
          </Text>
          <Text className="font-spartan text-sm text-gray-500 dark:text-gray-400">
            @{username}
          </Text>
        </View>
      </View>

      {/* 4. Aplicamos la lógica al color del ícono */}
      <Ionicons 
        name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
        size={28} 
        color={isSelected ? activeColor : "#8A8A8E"} 
      />
    </TouchableOpacity>
  );
}