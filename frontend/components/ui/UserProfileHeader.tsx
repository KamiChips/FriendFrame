import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

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
  const isDark = useColorScheme() === 'dark';
  const iconColor = isDark ? '#FFFFFF' : '#1A1D2E'; 

  return (
    <View className="w-full">
      
      {/* SECCIÓN SUPERIOR: Flecha, Campana y Menú */}
      <View className="bg-background-light dark:bg-[#1F2A4D] pt-12 pb-4 px-6 border-b-[1px] border-gray-300 dark:border-white/10 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color={iconColor} />
        </TouchableOpacity>
        
        {/* Contenedor Derecho: Campana + Menú */}
        <View className="flex-row items-center" style={{ gap: 20 }}>
          
          <TouchableOpacity className="relative" onPress={() => console.log('Notificaciones')}>
            <Ionicons name="notifications-outline" size={26} color={iconColor} />
            <View className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-[#30C2D9] border-2 border-background-light dark:border-[#1F2A4D]" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.navigate("/Settings")}>
            <Ionicons name="menu-outline" size={30} color={iconColor} />
          </TouchableOpacity>

        </View>
      </View>


      {/* SECCIÓN INFERIOR: Avatar, Stats y Textos */}

      <View className="bg-background-light dark:bg-[#182240] px-6 pt-2 pb-2">
        
        {/* FILA MEDIA: Avatar y Estadísticas */}
        <View className="mt-4 flex-row items-center justify-between">
          <LinearGradient colors={['#FF9B42', '#AA3E14']} style={{ padding: 2, borderRadius: 100 }}>
            <View className="bg-background-light dark:bg-[#182240]" style={{ padding: 3, borderRadius: 100 }}>
              <Image
                source={typeof profileImageSource === 'string' ? { uri: profileImageSource } : profileImageSource}
                style={{ width: 80, height: 80, borderRadius: 40 }} 
                contentFit="cover"
              />
            </View>
          </LinearGradient>

          <View className="flex-1 flex-row justify-around ml-6">
            <View className="items-center">
              <Text className="font-spartan-bold text-lg text-background-dark dark:text-white">{postsCount}</Text>
              <Text className="font-spartan text-xs text-background-dark dark:text-gray-400">Posts</Text>
            </View>
            <View className="items-center">
              <Text className="font-spartan-bold text-lg text-background-dark dark:text-white">{followersCount}</Text>
              <Text className="font-spartan text-xs text-background-dark dark:text-gray-400">Followers</Text>
            </View>
            <View className="items-center">
              <Text className="font-spartan-bold text-lg text-background-dark dark:text-white">{friendsCount}</Text>
              <Text className="font-spartan text-xs text-background-dark dark:text-gray-400">Following</Text>
            </View>
          </View>
        </View>

        {/* FILA INFERIOR: Textos */}
        <View className="mt-5">
          <Text className="font-spartan-bold text-2xl text-background-dark dark:text-white">
            {name}
          </Text>
          <Text className="font-spartan text-sm text-gray-500 dark:text-gray-400 mt-1">
            @{username}
          </Text>
        </View>

      </View>
      
    </View>
  );
}