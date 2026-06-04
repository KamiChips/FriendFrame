import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  TextInput,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

// Hook para respetar las "zonas seguras" del celular (notch arriba, barra de navegación abajo)
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CommentItem, { CommentType } from "./CommentItem";

// 1. INTERFAZ DE PROPIEDADES (CommentsModalProps)
interface CommentsModalProps {
  isVisible: boolean;                     // Controla si el modal se muestra o no
  onClose: () => void;                    // Función para cerrar el modal al tocar fuera o en la 'X'
  comments: CommentType[];                // El arreglo de comentarios que se va a mapear
  onAddComment?: (texto: string) => void; // Función puente para inyectar nuevos comentarios al Feed
}

// 2. COMPONENTE PRINCIPAL (CommentsModal)
// Renderiza un "Bottom Sheet" nativo que sube desde abajo y bloquea la pantalla.
export default function CommentsModal({
  isVisible,
  onClose,
  comments,
  onAddComment,
}: CommentsModalProps) {
  
  // ESTADOS Y REFERENCIAS
  const [newComment, setNewComment] = useState(""); // Almacena el texto que el usuario está escribiendo
  const insets = useSafeAreaInsets();               // Obtenemos los márgenes seguros nativos del dispositivo
  const inputRef = useRef<TextInput>(null);         // Referencia directa a la caja de texto (para forzar el teclado)

  const isDark = useColorScheme() === 'dark';

  // Calcula dinámicamente el número total sumando comentarios principales + respuestas anidadas
  const totalComments = comments.reduce((total, comment) => {
    return total + 1 + (comment.replies ? comment.replies.length : 0);
  }, 0);

  // FUNCIÓN: handleReply
  // Se ejecuta cuando el usuario toca el botón "Responder" en un CommentItem.
  const handleReply = (authorName: string) => {
    setNewComment(`@${authorName} `); // Pre-llena la caja de texto con el @nombre del usuario
    inputRef.current?.focus();        // Obliga a que el teclado del celular salte automáticamente
  };

  return (
    // Modal nativo de React Native: transparente y con animación de subida
    <Modal
      animationType="none"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <BlurView
        intensity={isDark ? 40 : 15}
        tint="dark"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {/* KeyboardAvoidingView: En iOS usa 'padding' para que el modal suba completo junto con el teclado.
        En Android usa 'height'. Esto evita que el teclado tape la barra de escribir.
      */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end" 
      >
        
        {/* ZONA INVISIBLE DE CIERRE: Si tocas el área negra/vacía arriba del modal, se cierra */}
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={onClose}
        />

   
        {/* 3. CONTENEDOR PRINCIPAL DEL BOTTOM SHEET (El cuadro blanco/azul oscuro) */}
   
        <View className="bg-white dark:bg-[#1F2B4A] rounded-t-3xl h-[75%] flex-col">
          
          {/* HEADER DEL MODAL: Título y Botón de Cerrar */}
          <View className="flex-row items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/10">
            <Text className="font-spartan-bold text-xl text-black dark:text-white">
              Comentarios ({totalComments})
            </Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={24} color="#8A8A8E" />
            </TouchableOpacity>
          </View>
          
          {/* LISTA DE COMENTARIOS: ScrollView central */}
          <ScrollView
            className="flex-1 px-6 pt-4"
            showsVerticalScrollIndicator={false} // Ocultamos la barra gris lateral
          >
            {/* Dibujamos un componente CommentItem por cada elemento en el arreglo */}
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onReply={handleReply} // Le pasamos la función para que el botón "Responder" reaccione
              />
            ))}
          </ScrollView>

     
          {/* 4. BARRA INFERIOR DE TEXTO (TEXT INPUT Y BOTÓN ENVIAR) */}
     
          <View
            className="px-4 pt-3 border-t border-gray-100 dark:border-white/10 flex-row items-center bg-white dark:bg-[#1A1D2E]"
            // Le damos padding bottom extra dependiendo de si el iPhone tiene barra "home" abajo (insets)
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            
            {/* CONTENEDOR DEL TEXT INPUT: Define la forma gris de pastilla (rounded-full) */}
            <View className="flex-1 flex-row items-center bg-gray-100 dark:bg-[#272B40] rounded-full px-4 h-12">
              <TextInput
                ref={inputRef}                     // Conectamos la referencia para el focus automático
                placeholder="Escribe un comentario..."
                placeholderTextColor="#8A8A8E"
                value={newComment}
                onChangeText={setNewComment}       // Actualiza el estado con cada tecla pulsada
                className="flex-1 font-spartan text-base text-black dark:text-white"
                style={{
                  height: "100%", 
                  paddingTop: 0, 
                  paddingBottom: 0,
                }}
              />
            </View>
            
            {/* BOTÓN NARAJA DE ENVIAR (Disabled si la caja está vacía) */}
            <TouchableOpacity
              className="ml-3 h-10 w-10 items-center justify-center rounded-full bg-primary-light dark:bg-[#FF9B42]"
              disabled={newComment.length === 0}
              style={{ opacity: newComment.length > 0 ? 1 : 0.5 }} // Se pone medio transparente si no hay texto
              
              onPress={() => {
                // Validación final: Verifica que la función exista y el texto no sean puros espacios en blanco (.trim())
                if (onAddComment && newComment.trim().length > 0) {
                  onAddComment(newComment.trim()); // Manda el texto validado al padre
                  setNewComment("");               // Vacía la caja de texto
                }
              }}
            >
              <Ionicons
                name="send"
                size={16}
                color="white"
                style={{ marginLeft: 3, marginTop: 1 }}
              />
            </TouchableOpacity>
            
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}