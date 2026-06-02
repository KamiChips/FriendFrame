import React, { useState } from 'react';
import { 
  View, Text, Modal, TouchableOpacity, ScrollView, 
  TextInput, KeyboardAvoidingView, Platform, useColorScheme 
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import '../../global.css';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  targetProfileName: string; // Ej: "Carlos Ramírez"
  currentUserName: string;   // Ej: "María González"
  currentUserInitials: string; // Ej: "MG"
}

// Simulamos las fotos del carrete del celular
const mockGallery = [
  { id: '1', uri: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba' }, // Buzos (Como en Figma)
  { id: '2', uri: 'https://images.unsplash.com/photo-1682687982501-1e58f81012a9' }, // Desierto
  { id: '3', uri: 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538' }, // Rocas
  { id: '4', uri: 'https://images.unsplash.com/photo-1682687982185-531d09ec56fc' }, // Dunas
  { id: '5', uri: 'https://images.unsplash.com/photo-1682692327050-0cecb827598c' }, // Mar
  { id: '6', uri: 'https://images.unsplash.com/photo-1682687218147-9806132dc697' }, // Palmeras
];

export default function CreatePostModal({ 
  visible, 
  onClose, 
  targetProfileName, 
  currentUserName, 
  currentUserInitials 
}: CreatePostModalProps) {
  
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';

  // Estados del modal
  const [step, setStep] = useState<1 | 2>(1); // 1: Galería, 2: Escribir pie de foto
  const [selectedImage, setSelectedImage] = useState<string>(mockGallery[0].uri);
  const [caption, setCaption] = useState('');

  // Limpia el estado y cierra el modal
  const handleClose = () => {
    setStep(1);
    setCaption('');
    onClose();
  };

  // Simula la publicación del post
  const handleShare = () => {
    console.log("Post creado con imagen:", selectedImage, "y texto:", caption);
    handleClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-white dark:bg-[#182240]"
      >
        {/* Espaciado para el notch del celular */}
        <View style={{ paddingTop: insets.top }} className="bg-white dark:bg-[#1F2B4A]">
          
          {/* HEADER DINÁMICO (Cambia según el Step) */}
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-white/5">
            {step === 1 ? (
              // Header Paso 1: Galería
              <>
                <TouchableOpacity onPress={handleClose} className="p-1">
                  <Ionicons name="close" size={26} color={isDark ? "white" : "black"} />
                </TouchableOpacity>
                <Text className="font-spartan-bold text-lg text-black dark:text-white">
                  Nueva publicación
                </Text>
                <TouchableOpacity onPress={() => setStep(2)}>
                  <Text className="font-spartan-bold text-[#FBA353] text-base">Siguiente</Text>
                </TouchableOpacity>
              </>
            ) : (
              // Header Paso 2: Detalles
              <>
                <TouchableOpacity onPress={() => setStep(1)} className="p-1">
                  <Ionicons name="chevron-back" size={26} color={isDark ? "white" : "black"} />
                </TouchableOpacity>
                <Text className="font-spartan-bold text-lg text-black dark:text-white">
                  Nuevo Post
                </Text>
                <TouchableOpacity onPress={handleShare}>
                  <Text className="font-spartan-bold text-[#FBA353] text-base">Compartir</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} bounces={false}>
          
          {/* PREVISUALIZACIÓN DE IMAGEN (Visible en ambos pasos) */}
          <View className="w-full aspect-square bg-gray-100 dark:bg-black relative">
            <Image 
              source={{ uri: selectedImage }} 
              style={{ width: '100%', height: '100%' }} 
              contentFit="cover" 
            />
            {/* Círculo naranja de seleccionado en la imagen grande (Solo Paso 1) */}
            {step === 1 && (
              <View className="absolute top-4 right-4 bg-[#AA3E14] rounded-full p-1 border-2 border-white dark:border-[#182240]">
                <Ionicons name="checkmark" size={20} color="white" />
              </View>
            )}
          </View>

          {/* CONTENIDO INFERIOR DINÁMICO */}
          {step === 1 ? (
            
            // --- PASO 1: GALERÍA DE FOTOS ---
            <View className="flex-1 bg-white dark:bg-[#182240]">
              
              {/* Barra de herramientas de galería */}
              <View className="flex-row justify-between items-center px-4 py-3 bg-gray-50 dark:bg-[#1F2B4A]">
                <Text className="font-spartan-bold text-base text-black dark:text-white">Recientes</Text>
                <TouchableOpacity className="flex-row items-center">
                  <Ionicons name="videocam-outline" size={18} color="#FBA353" />
                  <Text className="font-spartan text-sm text-[#FBA353] ml-1">Cámara</Text>
                </TouchableOpacity>
              </View>

              {/* Grid de fotos */}
              <View className="flex-row flex-wrap">
                {mockGallery.map((item) => {
                  const isSelected = selectedImage === item.uri;
                  return (
                    <TouchableOpacity 
                      key={item.id} 
                      className="w-[33.33%] aspect-square border-[0.5px] border-white dark:border-[#182240] relative"
                      onPress={() => setSelectedImage(item.uri)}
                      activeOpacity={0.9}
                    >
                      <Image source={{ uri: item.uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                      {/* Efecto de selección (Oscurecer foto no seleccionada) */}
                      {!isSelected && (
                        <View className="absolute inset-0 bg-black/20" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

          ) : (
            
            // --- PASO 2: ESCRIBIR DESCRIPCIÓN ---
            <View className="flex-1 px-4 pt-4 pb-10 bg-white dark:bg-[#182240]">
              
              {/* Fila del Usuario */}
              <View className="flex-row items-center mb-4">
                <LinearGradient 
                  colors={isDark ? ["#182240", "#AA3E14", "#115A67"] : ["#FAFAFA", "#30C2D9", "#FF9B42"]}
                  style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
                  start={{ x: 0, y: 0 }} end={{ x: 0.7, y: 0.7 }}
                >
                  <Text className="text-white text-xs font-bold">{currentUserInitials}</Text>
                </LinearGradient>
                <View className="ml-3">
                  <Text className="font-spartan-bold text-sm text-black dark:text-white">
                    {currentUserName}
                  </Text>
                  <Text className="font-spartan text-xs text-gray-500 dark:text-gray-400">
                    Publicando en el perfil de {targetProfileName}
                  </Text>
                </View>
              </View>

              {/* Área de Texto */}
              <TextInput
                className="font-spartan text-base text-black dark:text-white min-h-[100px]"
                placeholder="Escribe un pie de foto..."
                placeholderTextColor="#8A8A8E"
                multiline
                textAlignVertical="top"
                value={caption}
                onChangeText={setCaption}
              />

              {/* Etiquetar Personas */}
              <TouchableOpacity className="mt-6 flex-row items-center">
                <Text className="font-spartan-bold text-sm text-black dark:text-white">
                  Etiquetar personas
                </Text>
              </TouchableOpacity>
              
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}