import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface UserProfileHeaderProps {
  name: string;
  username: string;
  profileImageSource?: string | any;
  postsCount: number;
  friendsCount: number;
  followersCount: number;
}

export default function UserProfileHeader({
  name,
  username,
  profileImageSource,
  postsCount,
  friendsCount,
  followersCount,
}: UserProfileHeaderProps) {
  return (
    // Contenedor principal adaptable a light/dark mode
    <View className="w-full bg-background-light dark:bg-background-dark px-6 py-12 relative">
      
      {/* Icono de Menú superior derecho */}
      <TouchableOpacity className="absolute right-6 top-12 z-10">
        <Ionicons 
          name="menu-outline" 
          size={32} 
          // Color dinámico para el icono
          className="color-background-dark dark:color-background-light" 
        />
      </TouchableOpacity>

      {/* Fila Principal: Foto + Textos */}
      <View className="mt-4 flex-row items-center">
        
       {/* 1. Capa externa: El aro degradado */}
        <LinearGradient
          colors={['#FF9B42', '#AA3E14']} 
          style={{ padding: 3, borderRadius: 100 }} // padding = grosor del aro
        >
          {/* 2. Capa media: El hueco del color del fondo (crea la separación) */}
          <View 
            className="bg-background-light dark:bg-background-dark" 
            style={{ padding: 4, borderRadius: 100 }} // padding = separación entre foto y aro
          >
            {/* 3. Capa interna: La foto */}
            <Image
              source={typeof profileImageSource === 'string' ? { uri: profileImageSource } : profileImageSource}
              // Forzamos el tamaño y la mitad exacta (48) para el radio, haciéndola un círculo perfecto
              style={{ width: 96, height: 96, borderRadius: 48 }} 
              contentFit="cover"
            />
          </View>
        </LinearGradient>

        {/* Info de Nombre y Username a la derecha */}
        <View className="ml-8 flex-1">
          <Text className="font-spartan-bold text-5xl tracking-wide text-background-dark dark:text-background-light">
            {name}
          </Text>
          {/* Tu color exacto de primario oscuro para el @username */}
          <Text className="font-spartan-bold mt-1 text-2xl text-primary-dark">
            @{username}
          </Text>
          
          {/* Estadísticas con tu espaciado */}
          <View className="mt-4 flex-row gap-9">
            <View className="items-start">
              <Text className="font-spartan-bold text-xl text-background-dark dark:text-background-light">{postsCount}</Text>
              <Text className="font-spartan text-sm text-background-dark dark:text-background-light">Posts</Text>
            </View>
            
            <View className="items-start">
              <Text className="font-spartan-bold text-xl text-background-dark dark:text-background-light">{friendsCount}</Text>
              <Text className="font-spartan text-sm text-background-dark dark:text-background-light">Friends</Text>
            </View>

            <View className="items-start">
              <Text className="font-spartan-bold text-xl text-background-dark dark:text-background-light">{followersCount}</Text>
              <Text className="font-spartan text-sm text-background-dark dark:text-background-light">Followers</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}