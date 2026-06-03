import React, { useState } from 'react';
import { View, Text, ScrollView, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SearchBar from '@/components/ui/SearchBar';
import UserSearchRow from '@/components/ui/user-search-row';
import FriendFrameHeader from '@/components/ui/FriendframeHeader'; 
import '../../global.css';

const mockUsers = [
  { id: '1', name: 'Carlos Ramírez', username: 'carlos_r', initials: 'CR' },
  { id: '2', name: 'Ana López', username: 'ana_lopez', initials: 'AL' },
  { id: '3', name: 'Pedro Martínez', username: 'pedro_m', initials: 'PM' },
  { id: '4', name: 'Laura Ruiz', username: 'laura_r', initials: 'LR' },
  { id: '5', name: 'Diego Silva', username: 'diego_s', initials: 'DS' },
];

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const isDark = useColorScheme() === 'dark';

  const filteredUsers = mockUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    // 1. EL CONTENEDOR PADRE: Aquí pones el color para el reloj y el Header
    <SafeAreaView className="flex-1 bg-white dark:bg-[#1F2B4A]">
      
      {/* HEADER: Vive en la zona con el nuevo color */}
      <View className="">
        <FriendFrameHeader isDark={isDark} />
      </View>

      {/* 2. EL CONTENEDOR DEL CUERPO: Aquí mantenemos tu color original (#182240) */}
      <View className="flex-1 bg-background-light dark:bg-[#182240]">
        
        {/* Título y Barra de Búsqueda */}
        <View className="px-6 pt-6 pb-4">
          <Text className="font-spartan-bold text-2xl text-black dark:text-white mb-6">
            Buscar Usuarios
          </Text>

          <SearchBar 
            placeholder="Buscar por nombre o usuario..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>

        {/* Lista de Resultados */}
        <ScrollView 
          className="flex-1 px-6 pt-2"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <UserSearchRow
                key={user.id}
                name={user.name}
                username={`@${user.username}`}
                initials={user.initials}
                onPress={() => console.log('Ir al perfil de:', user.username)}
              />
            ))
          ) : (
            <View className="mt-10 items-center justify-center">
              <Text className="font-spartan text-gray-500 dark:text-gray-400 text-center">
                No se encontraron usuarios con "{searchQuery}"
              </Text>
            </View>
          )}

          {filteredUsers.length > 0 && (
            <Text className="font-spartan text-sm text-gray-400 dark:text-gray-500 text-center mt-10">
              Busca usuarios para seguir y conectar
            </Text>
          )}
        </ScrollView>
        
      </View>
    </SafeAreaView>
  );
}