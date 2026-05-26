import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import FeedCard from '@/components/ui/FeedCard'; 

// Le cambiamos el nombre a FeedScreen para que coincida con tu archivo feed.tsx
export default function FeedScreen() {
  return (
    // SafeAreaView protege el contenido para que no quede debajo de la hora o la batería del celular
    // Se implementa dark mode usando las clases de Tailwind y el color de fondo definido en tu tailwind.config.js
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark"> 
      
     {/* HEADER Provisional */}
      <View className="w-full max-w-2xl mx-auto px-4 py-3 flex-row justify-between items-center border-b border-gray-200 dark:border-gray-800/50">
        
        {/* Agregamos py-2 para que los trazos de Borel no se corten */}
        <Text className="text-2xl font-borel text-black dark:text-white py-3">
          FriendFrame
        </Text>
        
        <Ionicons name="notifications-outline" size={24} color="#8A8A8E" />
      </View>

      {/* CONTENEDOR DEL FEED */}
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }} // Espacio al final para que el último post no quede pegado abajo
      >
        <View className="w-full max-w-2xl mx-auto px-4 mt-4 gap-6">
          
          {/* Ejemplo 1: FRAGMENT */}
          <FeedCard
            authorName="Ana López"
            authorInitials="AL"
            timeAgo="hace 5 horas"
            targetProfileName="María González"
            textContent="Una de las personas más auténticas que conozco. Gracias por siempre estar ahí! 💙"
            likesCount={79}
            commentsCount={23}
            isLiked={true}
          />

          {/* Ejemplo 2: POST IMG local */}
          <FeedCard
            authorName="Carlos Ramírez"
            authorInitials="CR"
            timeAgo="hace 2 horas"
            targetProfileName="María González"
            textContent="María siempre encuentra los mejores lugares para el café! ☕"
            imageSource={require('../../assets/images/EjemploPost.jpg')} 
            likesCount={46}
            commentsCount={12}
            isLiked={false}
          />

        </View>
      </ScrollView>
      
    </SafeAreaView>
  );
}