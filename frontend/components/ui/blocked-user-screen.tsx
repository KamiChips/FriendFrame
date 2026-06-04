import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface BlockedUserScreenProps {
  fullName: string;
  onUnblock: () => Promise<void>;
  actionLoading: boolean;
}

export default function BlockedUserScreen({
  fullName,
  onUnblock,
  actionLoading,
}: BlockedUserScreenProps) {
  const router = useRouter();

  // Extrae de forma segura las iniciales (Ej: "Carlos Ramírez" -> "CR")
  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "??";

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#121f3d]">
        {/* BARRA SUPERIOR */}
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#1e2d4a]">
            <TouchableOpacity onPress={() => router.back()} className="p-1">
                <Feather name="arrow-left" size={24} className="text-gray-700 dark:text-gray-200" />
            </TouchableOpacity>

            <TouchableOpacity className="p-1 relative">
            <Feather name="bell" size={24} className="text-gray-700 dark:text-gray-200" />
            <View className="absolute top-1 right-1 w-2 h-2 bg-orange-400 dark:bg-teal-400 rounded-full" />
            </TouchableOpacity>
        </View>
        
        {/* CONTENIDO PRINCIPAL */}
        <View className="flex-1 items-center justify-center px-8">
            {/* Círculo Prohibido con Iniciales */}
            <View className="relative w-32 h-32 mb-6 items-center justify-center border-4 border-[#e24c5e] rounded-full">
                <View className="absolute w-1 h-[115%] bg-[#e24c5e] rotate-45" />
                <Text className="text-3xl font-spartan-bold tracking-wider text-gray-400 dark:text-gray-500">
                    {initials}
                </Text>
                <View className="absolute bottom-1 bg-white dark:bg-[#121f3d] border border-[#e24c5e] rounded-full p-1 z-10">
                    <Ionicons name="ban" size={14} color="#e24c5e" />
                </View>
            </View>

            {/* Textos Informativos */}
            <Text className="text-2xl font-spartan-bold mb-2 text-gray-900 dark:text-white">
            Usuario Bloqueado
            </Text>
            <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center mb-1">
            Has bloqueado a {fullName}
            </Text>
            <Text className="text-xs text-gray-400 dark:text-gray-500 text-center mb-10">
            No puedes ver su perfil ni interactuar con él
            </Text>

            {/* Botones de Acción */}
            <View className="w-full space-y-3 mb-8">
                <TouchableOpacity
                    className="w-full py-4 rounded-2xl items-center bg-[#30c0da] dark:bg-[#af4314]"
                    onPress={onUnblock}
                    disabled={actionLoading}
                >
                    {actionLoading ? (
                    <ActivityIndicator color="white" />
                    ) : (
                    <Text className="font-spartan-bold text-white text-base">
                        Desbloquear Usuario
                    </Text>
                    )}
                </TouchableOpacity>
            </View>
      </View>
    </SafeAreaView>
  );
}