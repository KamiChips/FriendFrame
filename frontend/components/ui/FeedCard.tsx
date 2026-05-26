import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

interface FeedCardProps {
  authorName: string;
  authorInitials: string;
  timeAgo: string;
  targetProfileName: string;
  textContent: string;
  imageSource?: string | any; 
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
}

export default function FeedCard({
  authorName,
  authorInitials,
  timeAgo,
  targetProfileName,
  textContent,
  imageSource,
  likesCount,
  commentsCount,
  isLiked = false,
}: FeedCardProps) {
  return (
    <View className="mb-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-transparent dark:bg-background-semidark">
      
      {/* --- CABECERA (Header) --- */}
      <View className="flex-row items-start p-4">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-light dark:bg-secondary-light">
          <Text className="font-spartan-bold text-lg text-white">
            {authorInitials}
          </Text>
        </View>

        <View className="ml-3 flex-1">
          <Text className="font-spartan-bold text-lg text-black dark:text-white">
            {authorName}
          </Text>
          <Text className="font-spartan text-sm text-gray-500 dark:text-gray-400">
            {timeAgo}
          </Text>
          <Text className="mt-1 font-spartan text-sm text-gray-600 dark:text-gray-300">
            → en el perfil de <Text className="font-spartan-bold">{targetProfileName}</Text>
          </Text>
        </View>
      </View>

      {/* --- CONTENIDO DE TEXTO --- */}
      <View className="px-4 pb-3">
        <Text className="font-spartan text-base leading-6 text-black dark:text-white">
          {textContent}
        </Text>
      </View>

      {/* --- IMAGEN (Renderizado Híbrido) --- */}
      {imageSource && (
        <View className="w-full bg-gray-50 dark:bg-gray-800/50">
          <Image
            source={typeof imageSource === 'string' ? { uri: imageSource } : imageSource}
            className="" 
            style={{ width: '100%', height: 320 }} 
            contentFit="contain" 
            transition={200}
          />
        </View>
      )}

      {/* --- PIE DE PÁGINA (Interacciones) --- */}
      <View className="flex-row items-center p-4">
        <Pressable className="mr-6 flex-row items-center">
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={24}
            color={isLiked ? '#30C2D9' : '#8A8A8E'} 
          />
          <Text className="ml-2 font-spartan text-base text-gray-500 dark:text-gray-400">
            {likesCount}
          </Text>
        </Pressable>

        <Pressable className="flex-row items-center">
          <Ionicons 
            name="chatbubble-outline" 
            size={22} 
            color="#8A8A8E" 
          />
          <Text className="ml-2 font-spartan text-base text-gray-500 dark:text-gray-400">
            {commentsCount}
          </Text>
        </Pressable>
      </View>

    </View>
  );
}