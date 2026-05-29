import React, { useState, useContext } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, SafeAreaView, KeyboardAvoidingView, Platform, useColorScheme } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; // Para los degradados del diseño
import '../../global.css';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  currentName: string;
  currentUsername: string;
  onSave: (name: string, username: string) => void;
}

export function EditProfileModal({ visible, onClose, currentName, currentUsername, onSave }: EditProfileModalProps) {
  const [name, setName] = useState(currentName);
  const [username, setUsername] = useState(currentUsername);
  const [isDark, setIsDark] = useState(useColorScheme() === 'dark');
  const size = 48; // Tamaño del avatar

  const handleSave = () => {
    onSave(name, username);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      {/* Contenedor principal */}
      <View className="flex-1 justify-end bg-black/60">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="w-full"
        >
          {/* Tarjeta Blanca del Modal */}
          <View className="bg-white dark:bg-neutral-950 rounded-t-[32px] px-6 pt-6 pb-10 shadow-2xl border-t border-gray-100 dark:border-neutral-800">
            
            {/* Encabezado del modal */}
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-xl font-bold text-[#1D2A4F] dark:text-white">
                Editar Perfil
              </Text>
              <TouchableOpacity onPress={onClose} className="p-1 bg-gray-100 dark:bg-neutral-800 rounded-full">
                <Ionicons name="close" size={20} color="#1D2A4F" className="dark:text-white" />
              </TouchableOpacity>
            </View>

            {/* avatar */}
            <View className="items-center mb-8 relative">
              <View className="relative">
                 <View  className="rounded-full overflow-hidden">
                    <LinearGradient  
                        colors={
                            isDark ? ["#182240", "#AA3E14", "#115A67"] 
                            : ["#FAFAFA", "#30C2D9", "#FF9B42"]
                        }
                        
                        style={{
                            width: size,
                            height: size,
                            alignItems: 'center',
                            justifyContent: "center",
                        }}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0.7, y: 0.7 }}
                >
                  <Text className="text-white text-3xl font-bold tracking-wider">MG</Text>
                </LinearGradient>
                 </View>
                
                {/* Botón de añadir */}
                <TouchableOpacity className="absolute right-0 bottom-0 bg-[#34C2DD] border-2 border-white w-8 h-8 rounded-full items-center justify-center shadow-md active:opacity-80 dark:bg-[#AA3E14] dark:border-neutral-950">
                  <Ionicons name="add" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {/* formulario */}
            <View className="space-y-5 mb-8">
              
              {/* Input 1: Nombre completo */}
              <View className="mb-4">
                <View className="flex-row items-center mb-2">
                  <Feather name="user" size={16} color="#1D2A4F" className="dark:text-neutral-400 mr-2" />
                  <Text className="font-bold text-[#1D2A4F] dark:text-neutral-300 text-sm">
                    Nombre completo
                  </Text>
                </View>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  className="bg-[#EAEAEA] dark:bg-neutral-900 p-4 rounded-xl text-gray-700 dark:text-white font-medium text-base"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Input 2: Nombre de usuario */}
              <View className="mb-2">
                <View className="flex-row items-center mb-2">
                  <Feather name="at-sign" size={16} color="#1D2A4F" className="dark:text-neutral-400 mr-2" />
                  <Text className="font-bold text-[#1D2A4F] dark:text-neutral-300 text-sm">
                    Nombre de usuario
                  </Text>
                </View>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  className="bg-[#EAEAEA] dark:bg-neutral-900 p-4 rounded-xl text-gray-700 dark:text-white font-medium text-base"
                  placeholderTextColor="#9CA3AF"
                />
                <Text className="text-gray-400 text-xs mt-1.5 ml-1">
                  Solo letras, números y guiones bajos
                </Text>
              </View>

            </View>

            {/* guardar */}
            <TouchableOpacity onPress={handleSave} className="active:opacity-90 shadow-md">
              <LinearGradient
                colors={['#34C2DD', '#FBA353']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }} // Gradiente horizontal
                className="py-4 rounded-xl flex-row justify-center items-center"
              >
                <Ionicons name="save-outline" size={20} color="white" className="mr-2" />
                <Text className="text-white font-bold text-base">
                  Guardar Cambios
                </Text>
              </LinearGradient>
            </TouchableOpacity>

          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}