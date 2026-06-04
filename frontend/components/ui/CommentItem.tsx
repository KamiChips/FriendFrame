import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';


// 1. INTERFACES DE DATOS
// Definen la estructura exacta que deben tener los comentarios y las respuestas.


// Estructura para las respuestas anidadas (hijas)
export interface ReplyType {
  id: string;
  authorInitials: string;
  authorName: string;
  content: string;
  likesCount: number;
  timeAgo: string;
  isLiked?: boolean; // Opcional: Indica si el usuario le dio like a la respuesta
}

// Estructura para el comentario principal (padre)
export interface CommentType {
  id: string;
  authorInitials: string;
  authorName: string;
  content: string;
  likesCount: number;
  timeAgo: string;
  isLiked?: boolean;
  replies?: ReplyType[]; // Opcional: Arreglo que contiene las respuestas hijas
}

// Propiedades que recibe este componente desde el CommentsModal
interface CommentItemProps {
  comment: CommentType;                    // El objeto de datos del comentario
  onReply: (authorName: string, commentId: string) => void;   // Función para pre-llenar el input con el @nombre
}


// 2. COMPONENTE PRINCIPAL (CommentItem)
// Dibuja UNA sola burbuja de comentario principal, y si tiene respuestas,
// las dibuja justo debajo con un margen a la izquierda (anidadas).

export default function CommentItem({ comment, onReply }: CommentItemProps) {
  // Detecta el modo oscuro para aplicar colores condicionales si es necesario
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View className="mb-4">

   
      {/* 3. COMENTARIO PRINCIPAL (NIVEL 0) */}
      {/* Ej: El comentario original que hizo Carlos o Laura. */}
   
      <View className="flex-row items-start">
        
        {/* AVATAR DEL COMENTARIO PRINCIPAL */}
        <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-light dark:bg-secondary-light">
          <Text className="font-spartan-bold text-sm text-white">
            {comment.authorInitials}
          </Text>
        </View>

        {/* CONTENEDOR DEL TEXTO Y BOTONES */}
        <View className="ml-3 flex-1">
          
          {/* BURBUJA DE TEXTO (Gris/Azul oscuro) */}
          {/* rounded-tl-sm quita el borde redondeado superior izquierdo para dar efecto de burbuja de chat */}
          <View className="bg-gray-200 dark:bg-[#2A3654] rounded-2xl p-3 rounded-tl-sm">
             <Text className="font-spartan-bold text-sm text-black dark:text-white mb-1">
               {comment.authorName}
             </Text>
             <Text className="font-spartan text-sm text-black dark:text-gray-200">
               {comment.content}
             </Text>
          </View>

          {/* BARRA DE ACCIONES (Like, Responder, Tiempo) */}
          <View className="flex-row items-center mt-2 ml-2">
            
            {/* BOTÓN DE LIKE */}
            <TouchableOpacity className="flex-row items-center mr-4">
               <Ionicons 
                 name={comment.isLiked ? "heart" : "heart-outline"} 
                 size={16} 
                 color={comment.isLiked ? "#30C2D9" : "#8A8A8E"} 
               />
               <Text className="font-spartan text-xs text-gray-500 dark:text-gray-400 ml-1">
                 {comment.likesCount}
               </Text>
            </TouchableOpacity>
            
            {/* BOTÓN RESPONDER (Envía el nombre del autor principal al modal) */}
            <TouchableOpacity className="mr-4" onPress={() => onReply(comment.authorName, comment.id)}>
                <Text className="font-spartan text-xs text-gray-500 dark:text-gray-400">Responder</Text>
            </TouchableOpacity>
            
            {/* ETIQUETA DE TIEMPO */}
            <Text className="font-spartan text-xs text-gray-500 dark:text-gray-400">
              {comment.timeAgo}
            </Text>
          </View>

        </View>
      </View>
   
      {/* 4. RESPUESTAS ANIDADAS (NIVEL 1)                                      */}
      {/* Solo se dibuja esta sección si el comentario tiene el arreglo `replies`.*/}
   
      {comment.replies && comment.replies.length > 0 && (
        
        // El margen izquierdo (ml-11) empuja las respuestas para que queden alineadas bajo la burbuja principal
        <View className="mt-3 ml-11">
           {comment.replies.map((reply) => (
              <View key={reply.id} className="flex-row items-start mb-3 mt-1 relative">
                 
                 {/* ÍCONO DE FLECHA CURVA (Indica visualmente que es una respuesta) */}
                 {/* absolute -left-7 lo posiciona en el espacio vacío que dejamos con el ml-11 del padre */}
                 <View className="absolute -left-7 top-0">
                    <Ionicons name="return-down-forward-outline" size={20} color="#8A8A8E" />
                 </View>
                 
                 {/* AVATAR DE LA RESPUESTA (Colores diferentes: Naranja en Dark Mode) */}
                 <View className="h-8 w-8 items-center justify-center rounded-full bg-secondary-light dark:bg-[#FF9B42]">
                    <Text className="font-spartan-bold text-xs text-white">{reply.authorInitials}</Text>
                 </View>

                 {/* CONTENEDOR DEL TEXTO Y BOTONES DE LA RESPUESTA */}
                 <View className="ml-2 flex-1">
                    
                    {/* BURBUJA DE TEXTO (Tonos naranjas/Azul más claro para diferenciar del principal) */}
                    <View className="bg-orange-50 dark:bg-[#1E304D] border border-orange-200 dark:border-transparent rounded-2xl p-3 rounded-tl-sm">
                       <Text className="font-spartan-bold text-sm text-black dark:text-white mb-1">{reply.authorName}</Text>
                       <Text className="font-spartan text-sm text-black dark:text-gray-200">{reply.content}</Text>
                    </View>
                    
                    {/* BARRA DE ACCIONES DE LA RESPUESTA (Like, Responder, Tiempo) */}
                    <View className="flex-row items-center mt-2 ml-2">
                      
                      {/* BOTÓN DE LIKE (Más pequeño: size 14) */}
                      <TouchableOpacity className="flex-row items-center mr-4">
                         <Ionicons 
                           name={reply.isLiked ? "heart" : "heart-outline"} 
                           size={14} 
                           color={reply.isLiked ? "#30C2D9" : "#8A8A8E"} 
                         />
                         <Text className="font-spartan text-xs text-gray-500 dark:text-gray-400 ml-1">
                           {reply.likesCount}
                         </Text>
                      </TouchableOpacity>
                      
                      {/* BOTÓN RESPONDER (Envía el nombre del autor de la respuesta al modal) */}
                      <TouchableOpacity className="mr-4" onPress={() => onReply(reply.authorName, reply.id)}>
                          <Text className="font-spartan text-xs text-gray-500 dark:text-gray-400">Responder</Text>
                      </TouchableOpacity>
                      
                      {/* ETIQUETA DE TIEMPO */}
                      <Text className="font-spartan text-xs text-gray-500 dark:text-gray-400">{reply.timeAgo}</Text>
                    </View>
                 </View>
              </View>
           ))}
        </View>
      )}
    </View>
  );
}