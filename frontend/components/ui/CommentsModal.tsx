import React, { useState, useRef, useEffect } from "react";
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

// Hook para cargar y publicar comentarios
import { useComments } from "@/hooks/useComments";
import { PublicationTarget } from "@/services/supabase/interactions/types";

// Hook para respetar las "zonas seguras" del celular (notch arriba, barra de navegación abajo)
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CommentItem, { CommentType } from "./CommentItem";
import { AppComment } from '../../services/supabase/interactions/types';

// 1. INTERFAZ DE PROPIEDADES (CommentsModalProps)
interface CommentsModalProps {
  isVisible: boolean;                     // Controla si el modal se muestra o no
  onClose: () => void;                    // Función para cerrar el modal al tocar fuera o en la 'X'
  target: PublicationTarget;                // El arreglo de comentarios que se va a mapear
  onCommentAdded?: () => void; // Función puente para inyectar nuevos comentarios al Feed
}

// 2. COMPONENTE PRINCIPAL (CommentsModal)
// Renderiza un "Bottom Sheet" nativo que sube desde abajo y bloquea la pantalla.
export default function CommentsModal({
  isVisible,
  onClose,
  target,
  onCommentAdded,
}: CommentsModalProps) {
  
  // ESTADOS Y REFERENCIAS
  const [newComment, setNewComment] = useState(""); // Almacena el texto que el usuario está escribiendo
  const insets = useSafeAreaInsets();               // Obtenemos los márgenes seguros nativos del dispositivo
  const inputRef = useRef<TextInput>(null);         // Referencia directa a la caja de texto (para forzar el teclado)
  const { comments, load, post } = useComments(target);
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    authorName: string;
  } | null>(null);

  const isDark = useColorScheme() === 'dark';

  // Cargar comentarios al abrir el modal
  useEffect(() => {
    if (isVisible) load();
  }, [isVisible]);
  
  const handlePost = async () => {
    if (!newComment.trim()) return;
    const result = await post(newComment.trim(), replyingTo?.commentId);
    if (result) {
      setNewComment("");
      setReplyingTo(null);
      onCommentAdded?.();
    }
  }

  function timeAgo(isoDate: string): string {
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "ahora mismo";
    if (mins < 60) return `hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs} h`;
    return `hace ${Math.floor(hrs / 24)} d`;
  }

  function initials(fullName: string): string {
    return fullName
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
  } 

  function toCommentType(c: AppComment): CommentType {
    return {
      id: c.comment_id,
      authorName: c.author.full_name,
      authorInitials: initials(c.author.full_name),
      content: c.content,
      likesCount: c.likes_count,
      timeAgo: timeAgo(c.created_at),
      isLiked: c.liked_by_me,
      replies: c.replies?.map((r) => ({
        id: r.comment_id,
        authorName: r.author.full_name,
        authorInitials: initials(r.author.full_name),
        content: r.content,
        likesCount: r.likes_count,
        timeAgo: timeAgo(r.created_at),
        isLiked: r.liked_by_me,
      })),
    };
  }

  // Calcula dinámicamente el número total sumando comentarios principales + respuestas anidadas
  const totalComments = comments.reduce((total, comment) => {
    return total + 1 + (comment.replies ? comment.replies.length : 0);
  }, 0);

  // FUNCIÓN: handleReply
  // Se ejecuta cuando el usuario toca el botón "Responder" en un CommentItem.
  const handleReply = (authorName: string, commentId: string) => {
    setReplyingTo({ commentId, authorName });
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
            keyboardShouldPersistTaps="handled"
          >
            {/* Dibujamos un componente CommentItem por cada elemento en el arreglo */}
            {comments.map((comment) => (
              <CommentItem
                key={comment.comment_id}
                comment={toCommentType(comment)}
                onReply={handleReply} // Le pasamos la función para que el botón "Responder" reaccione
              />
            ))}
          </ScrollView>

          {/* RESPONDIENDO: menciona a quien está responiendo y la opción de cancelar */}
          {replyingTo && (
            <View className="flex-row items-center justify-between px-4 py-2 bg-gray-50 dark:bg-[#1A1D2E]">
              <Text className="font-spartan text-xs text-gray-500 dark:text-gray-400">
                Respondiendo a{" "}
                <Text className="font-spartan-bold text-primary-light">@{replyingTo.authorName}</Text>
              </Text>
              <TouchableOpacity onPress={() => {
                setReplyingTo(null);
                setNewComment("");
              }}>
                <Ionicons name="close-circle" size={16} color="#8A8A8E" />
              </TouchableOpacity>
            </View>
          )}

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
              
              onPress={handlePost}
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