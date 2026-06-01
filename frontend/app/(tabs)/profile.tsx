import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import UserProfileHeader from '@/components/ui/UserProfileHeader'; 
import '../../global.css';
import { FloatingMenu } from '@/components/ui/FloatingMenu';
import BlockUserWarning from '@/components/ui/BlockUserWarning';

export default function ProfileScreen() {
  return (
    // Agregamos el modo claro y oscuro dinámico al fondo principal
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        
        <UserProfileHeader
          name="User"
          username="username"
          profileImageSource={require('../../assets/images/Rick.jpg')} 
          postsCount={100}
          friendsCount={100}
          followersCount={100}
        />

        <BlockUserWarning name='vgyutcd' />

        {/* Contenedor inferior (la "tarjeta" que se ve en tu mockup) */}
        <View className="flex-1 bg-background-gray dark:bg-background-semidark mt-4 rounded-t-[30px] min-h-[500px]">
          {/* Aquí irá todo el contenido de las publicaciones gestionadas por los amigos */}
        </View>

        <FloatingMenu
          onCreatePost={() => {
            // Aquí puedes manejar la acción de crear un nuevo post
            console.log('Crear nuevo post');
          }}
          onCreateFragment={() => {
            // Aquí puedes manejar la acción de crear un nuevo fragment
            console.log('Crear nuevo fragment');
          }}
        />
        
      </ScrollView>
    </SafeAreaView>
  );
}