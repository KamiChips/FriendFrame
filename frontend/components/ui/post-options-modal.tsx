import React from 'react';
import { View, Text, Pressable, Modal, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface PostOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function PostOptionsModal({ 
  visible, 
  onClose, 
  onEdit, 
  onDelete 
}: PostOptionsModalProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <Modal visible={visible} transparent animationType="none">
      
      {/*BlurView*/}
      <BlurView 
        intensity={isDark ? 40 : 15} 
        tint="dark" 
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        
        {/* 3. Área invisible para cerrar el modal al tocar afuera */}
        <Pressable style={{ flex: 1 }} onPress={onClose} />

        {/* El menú blanco/azul oscuro */}
        <View className="w-full rounded-t-3xl bg-white px-6 pb-10 pt-4 shadow-lg dark:bg-[#1F2B4A]">
          
          <View className="mb-6 h-1.5 w-12 self-center rounded-full bg-gray-300 dark:bg-gray-600" />

          {/* Opción: Editar */}
          <Pressable 
            className="flex-row items-center border-b border-gray-100 py-4 dark:border-white/10"
            onPress={() => {
              onEdit();
              onClose();
            }}
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <Ionicons name="pencil-outline" size={20} color={isDark ? "white" : "black"} />
            </View>
            <Text className="ml-4 font-spartan-bold text-lg text-black dark:text-white">
              Editar publicación
            </Text>
          </Pressable>

          {/* Opción: Eliminar */}
          <Pressable 
            className="flex-row items-center py-4 mt-2"
            onPress={() => {
              onDelete();
              onClose();
            }}
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </View>
            <Text className="ml-4 font-spartan-bold text-lg text-[#EF4444]">
              Eliminar publicación
            </Text>
          </Pressable>

        </View>
      </BlurView>
    </Modal>
  );
}