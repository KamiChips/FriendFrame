import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

// Importación de sub-componentes necesarios para los comentarios
import CommentsModal from './CommentsModal';
import { CommentType } from './CommentItem'; 


// 1. INTERFAZ DE PROPIEDADES (FeedCardProps)
// Define "las reglas" de los datos que esta tarjeta necesita para funcionar.
// El padre (Feed.tsx) debe pasarle obligatoriamente la mayoría de estos datos.

interface FeedCardProps {
  authorName: string;           // Ej: "Ana López"
  authorInitials: string;       // Ej: "AL" (Para el avatar)
  timeAgo: string;              // Ej: "hace 5 horas"
  targetProfileName: string;    // Ej: "María González" (A quién le publicaron)
  textContent: string;          // El texto del post
  imageSource?: string | any;   // Opcional (?): Imagen adjunta al post
  likesCount: number;           // Contador de Me Gusta
  commentsCount: number;        // Contador visual de comentarios
  isLiked?: boolean;            // Opcional (?): Indica si el usuario actual ya le dio like
  comments?: CommentType[];     // Opcional (?): El arreglo de comentarios que se pasará al modal
  onAddComment?: (texto: string) => void; // Función puente para guardar nuevos comentarios
}


// 2. COMPONENTE PRINCIPAL (FeedCard)
// Tarjeta reutilizable que muestra una publicación individual en el muro.

export default function FeedCard({
  authorName,
  authorInitials,
  timeAgo,
  targetProfileName,
  textContent,
  imageSource,
  likesCount,
  commentsCount,
  isLiked = false, // Si no nos dicen nada, asumimos que no tiene like
  comments = [],   // Si no mandan comentarios, usamos un arreglo vacío por defecto
  onAddComment,    // Recibimos la función que viene desde Feed.tsx
}: FeedCardProps) {
  
  // ESTADO LOCAL: Controla si el modal de comentarios de esta tarjeta está abierto o cerrado
  const [isCommentsModalVisible, setCommentsModalVisible] = useState(false);

  return(
    // CONTENEDOR PRINCIPAL DE LA TARJETA
    // Tiene bordes redondeados, sombra ligera y se adapta al modo oscuro
    <View className="mb-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-transparent dark:bg-background-semidark">
      
  
      {/* 3. CABECERA DE LA TARJETA (Header) */}
  
      <View className="flex-row items-start p-4"> 
        
        {/* AVATAR: Círculo de color con las iniciales del autor */}
        <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-light dark:bg-secondary-light">
          <Text className="font-spartan-bold text-lg text-white">
            {authorInitials}
          </Text>
        </View>

        {/* INFORMACIÓN DEL AUTOR: Nombre, Tiempo y Destinatario */}
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

  
      {/* 4. CONTENIDO PRINCIPAL (Texto) */}
  
      <View className="px-4 pb-3">
        <Text className="font-spartan text-base leading-6 text-black dark:text-white">
          {textContent}
        </Text>
      </View>

  
      {/* 5. IMAGEN ADJUNTA (Renderizado Condicional) */}
  
      {/* Solo se dibuja en la pantalla si el post trae un "imageSource" */}
      {imageSource && (
        <View className="w-full bg-gray-50 dark:bg-gray-800/50">
          <Image
            // Soporta tanto imágenes de internet (uri) como archivos locales (require)
            source={typeof imageSource === 'string' ? { uri: imageSource } : imageSource}
            className="" 
            style={{ width: '100%', height: 320 }} 
            contentFit="contain" // Ajusta la imagen sin recortarla
            transition={200}     // Efecto de aparición suave
          />
        </View>
      )}

  
      {/* 6. PIE DE PÁGINA (Botones de Interacción) */}
  
      <View className="flex-row items-center p-4">
        
        {/* BOTÓN DE LIKE */}
        <Pressable className="mr-6 flex-row items-center">
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'} // Cambia de contorno a relleno si tiene like
            size={24}
            color={isLiked ? '#30C2D9' : '#8A8A8E'}    // Cambia a azul si está activo
          />
          <Text className="ml-2 font-spartan text-base text-gray-500 dark:text-gray-400">
            {likesCount}
          </Text>
        </Pressable>

        {/* BOTÓN DE COMENTARIOS */}
        {/* Al presionarlo, cambia el estado isCommentsModalVisible a TRUE para abrir el modal */}
        <Pressable className="flex-row items-center" onPress={() => setCommentsModalVisible(true)}>
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

  
      {/* 7. MODAL DE COMENTARIOS INVISIBLES */}
      {/* Este componente siempre está renderizado pero oculto hasta que isVisible es true */}
      <CommentsModal 
        isVisible={isCommentsModalVisible} 
        onClose={() => setCommentsModalVisible(false)} // Función para que el modal pueda cerrarse a sí mismo
        comments={comments}                            // Le inyectamos los datos para que dibuje la lista
        onAddComment={onAddComment}                    // Le pasamos la función para que el botón Enviar funcione
      />
      
    </View>
  );
}