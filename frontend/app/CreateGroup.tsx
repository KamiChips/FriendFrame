import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import SearchBar from '@/components/ui/SearchBar';
import SelectableUserRow from '@/components/ui/SelectableUserRow';

const MOCK_FRIENDS = [
  { id: '1', name: 'Roger', username: 'el_capitan', avatar: require('../assets/images/EjemploPost.jpg') },
  { id: '2', name: 'Kamila', username: 'kamila_con_k', avatar: require('../assets/images/EjemploPost.jpg') },
  { id: '3', name: 'Mayrin', username: 'mayrun', avatar: require('../assets/images/EjemploPost.jpg') },
  { id: '4', name: 'Christopher', username: 'el_guapo', avatar: require('../assets/images/EjemploPost.jpg') },
  { id: '5', name: 'Rick', username: 'ricky_ricon', avatar: require('../assets/images/Rick.jpg') },
];

export default function CreateGroupScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const toggleFriendSelection = (id: string) => {
    if (selectedFriends.includes(id)) {
      setSelectedFriends(selectedFriends.filter(friendId => friendId !== id));
    } else {
      setSelectedFriends([...selectedFriends, id]);
    }
  };

  return (
    // KeyboardAvoidingView evita que el teclado de Android/iOS oculte tu UI
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 justify-end bg-black/50" // Fondo translúcido oscuro
    >
      
      {/* TARJETA INFERIOR (Bottom Sheet) */}
      <View className="bg-background-light dark:bg-background-semidark rounded-t-[32px] px-6 pt-6 pb-8 max-h-[90%] shadow-lg">
        
        {/* HEADER DEL MODAL */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="font-spartan-bold text-2xl text-background-dark dark:text-background-light">
            Crear Grupo
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close"
            size={28}
            color={isDark ? "white" : "black"} 
            />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="w-full">
          
          {/* INPUT: NOMBRE DEL GRUPO */}
          <View className="mb-6">
            <Text className="font-spartan-bold text-sm text-background-dark dark:text-background-light mb-2">
              Nombre del grupo
            </Text>
            <TextInput
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Ej: Los mejores amigos"
              placeholderTextColor="#8A8A8E"
              maxLength={30}
              className="w-full h-14 bg-transparent border border-gray-300 dark:border-gray-600 rounded-xl px-4 font-spartan text-base text-background-dark dark:text-background-light"
            />
          </View>

          {/* SECCIÓN: AGREGAR MIEMBROS */}
          <View className="mb-2">
            <Text className="font-spartan-bold text-sm text-background-dark dark:text-background-light mb-2">
              Agregar miembros ({selectedFriends.length} seleccionados)
            </Text>
            
            {/* Buscador (Reutilizable) */}
            <View className="mb-4">
              <SearchBar 
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Buscar amigos..."
              />
            </View>

            {/* Lista de Amigos (Reutilizable) */}
            <View className="pb-6">
              {MOCK_FRIENDS.map((friend) => (
                <SelectableUserRow
                  key={friend.id}
                  name={friend.name}
                  username={friend.username}
                  avatarSource={friend.avatar}
                  isSelected={selectedFriends.includes(friend.id)}
                  onToggle={() => toggleFriendSelection(friend.id)}
                />
              ))}
            </View>
          </View>

        </ScrollView>

        {/* BOTÓN CREAR (Alineado abajo para completar el formulario) */}
        <TouchableOpacity 
          disabled={groupName.length === 0 || selectedFriends.length === 0}
          className={`py-4 rounded-xl items-center mt-2 ${
            groupName.length > 0 && selectedFriends.length > 0 
              ? 'bg-primary-light dark:bg-primary-dark' 
              : 'bg-gray-300 dark:bg-gray-700'
          }`}
        >
          <Text className="font-spartan-bold text-white text-lg">Crear</Text>
        </TouchableOpacity>

      </View>
    </KeyboardAvoidingView>
  );
}