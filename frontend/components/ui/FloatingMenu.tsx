import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { NewFragment } from './NewFragment';

interface FloatingMenuProps {
  onCreatePost?: () => void;
  onCreateFragment?: () => void;
}

export function FloatingMenu({ onCreatePost, onCreateFragment }: FloatingMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Valores de animación compartidos
  const animation = useRef(new Animated.Value(0)).current;

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;
    
    // Configuración de la animación (Cerrar/Abrir)
    Animated.spring(animation, {
      toValue,
      friction: 6, // Controla el rebote
      tension: 40,
      useNativeDriver: true, // Optimización de rendimiento
    }).start();

    setIsOpen(!isOpen);
  };

  // Interpolaciones para las animaciones
  
  // 1. Opacidad del fondo oscuro (Overlay)
  const backdropOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4], // Llega a 40% de opacidad
  });

  // 2. Desplazamiento vertical (Y) de los botones pequeños
  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0], // Sube 20 píxeles al abrirse
  });

  // 3. Opacidad de los botones pequeños
  const menuOpacity = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1], // Aparece gradualmente
  });

  // 4. Rotación del botón principal (para el efecto Plus -> X)
  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  // 5. Controla si el modal de Fragment está abierto
  const [isModalVisible, setIsModalVisible] = useState(false);

  // 6. Funcion para publicar el Fragment
  const handlePublishFragment = (text: string) => {
    console.log("Publicando Fragment: ", text);
    // logica de base de datos
    setIsModalVisible(false); // Cierra el modal después de publicar
  };

  const animatedStyles = {
    transform: [{ translateY }],
    opacity: menuOpacity,
  };

  return (
    <View className="absolute inset-0 pointer-events-box-none z-50 justify-end items-end pb-10 pr-6">
      
      {/* Fondo oscuro (Aparece y si lo tocas, cierra el menú) */}
      {isOpen && (
        <TouchableWithoutFeedback onPress={toggleMenu}>
          <Animated.View 
            style={{ opacity: backdropOpacity }}
            className="absolute inset-0 bg-black"
          />
        </TouchableWithoutFeedback>
      )}

      {/* Contenedor de las Opciones del Menú */}
      <Animated.View style={[animatedStyles]} className="pb-10 mb-5 space-y-6 items-end">
        
        {/* Opción: Crear Post */}
        <TouchableOpacity 
          onPress={() => {
            toggleMenu();
            if (onCreatePost) onCreatePost();
          }}
          activeOpacity={0.8}
          className="flex-row items-center bg-white px-5 py-3 rounded-full shadow-lg shadow-black/20 mb-2"
        >
          <Ionicons name="add" size={18} color="#06b6d4" className="mr-2" />
          <Text className="text-gray-800 font-medium text-sm">Crear Post</Text>
        </TouchableOpacity>

        {/* Opción: Crear Fragment */}
        <TouchableOpacity 
          onPress={() => {
            toggleMenu();
            setIsModalVisible(true);
          }}
          activeOpacity={0.8}
          className="flex-row items-center bg-white px-5 py-3 rounded-full shadow-lg shadow-black/20"
        >
          <Ionicons name="document-text" size={18} color="#f97316" className="mr-2" />
          <Text className="text-gray-800 font-medium text-sm">Crear Fragment</Text>
        </TouchableOpacity>

        {/* Modal de Fragment */}
        <NewFragment
          isVisible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          onPublish={handlePublishFragment}
        />
      </Animated.View>

      {/* Botón Principal (Trigger) */}
      <TouchableOpacity
        onPress={toggleMenu}
        activeOpacity={0.9}
        className={`w-14 h-14 rounded-full items-center justify-center shadow-lg shadow-black/30 ${
          isOpen ? 'bg-gray-500' : 'bg-amber-500' 
        }`}
      >
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          {isOpen ? (
            <Ionicons name="close" size={28} color="#ffffff" />
          ) : (
            <Ionicons name="add" size={28} color="#ffffff" />
          )}
        </Animated.View>
      </TouchableOpacity>

    </View>
  );
}