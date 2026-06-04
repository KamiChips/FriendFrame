import React, { useState } from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import PostOptionsModal from "./post-options-modal";
import CommentsModal from "./CommentsModal";
import { useColorScheme } from "react-native";
import { CommentType } from "./CommentItem";
import ProfileIcon from "./ProfileIcon";

interface FeedCardProps {
  authorName: string;
  authorInitials: string;
  authorImage?: string | null;
  timeAgo: string;
  targetProfileName: string;
  textContent: string;
  imageSource?: string | any;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  isOwnPost?: boolean;
  comments?: CommentType[];
  targetUserImage?: string | null;
  onAddComment?: (texto: string) => void;
}

export default function FeedCard({
  authorName,
  authorInitials,
  authorImage,
  timeAgo,
  targetProfileName,
  textContent,
  imageSource,
  likesCount,
  commentsCount,
  isLiked = false,
  isOwnPost = false,
  comments = [],
  targetUserImage,
  onAddComment,
}: FeedCardProps) {
  const [isCommentsModalVisible, setCommentsModalVisible] = useState(false);
  const [isMenuVisible, setMenuVisible] = useState(false);

  return (
    <View className="mb-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-transparent dark:bg-background-semidark">
      {/* 1. CABECERA DE LA TARJETA */}
      <View className="flex-row items-start justify-between p-4">
        <View className="flex-row items-start flex-1">
          {authorImage &&
          typeof authorImage === "string" &&
          authorImage.trim() !== "" ? (
            <Image
              source={{ uri: authorImage }}
              style={{ width: 48, height: 48, borderRadius: 24 }}
              contentFit="cover"
            />
          ) : (
            // Si no hay imagen, mostramos el ProfileIcon con las iniciales
            <ProfileIcon
              initials={authorInitials}
              isDark={useColorScheme() === "dark"} // Pasa dinámicamente si es dark mode
              size={48}
            />
          )}
          <View className="ml-3 flex-1">
            <Text className="font-spartan-bold text-lg text-black dark:text-white">
              {authorName}
            </Text>
            <Text className="font-spartan text-sm text-gray-500 dark:text-gray-400">
              {timeAgo}
            </Text>
            <Text className="mt-1 font-spartan text-sm text-gray-600 dark:text-gray-300">
              → en el perfil de{" "}
              <Text className="font-spartan-bold">{targetProfileName}</Text>
            </Text>
          </View>
        </View>

        {/* 3 PUNTITOS (Solo si es post propio) */}
        {isOwnPost && (
          <Pressable onPress={() => setMenuVisible(true)} className="p-2 -mr-2">
            <Ionicons name="ellipsis-horizontal" size={20} color="#8A8A8E" />
          </Pressable>
        )}
      </View>

      {/* 2. CONTENIDO PRINCIPAL (Texto) */}
      <View className="px-4 pb-3">
        <Text className="font-spartan text-base leading-6 text-black dark:text-white">
          {textContent}
        </Text>
      </View>

      {/* 3. IMAGEN ADJUNTA */}
      {imageSource && (
        <View className="w-full bg-gray-50 dark:bg-gray-800/50">
          <Image
            source={
              typeof imageSource === "string"
                ? { uri: imageSource }
                : imageSource
            }
            style={{ width: "100%", height: 320 }}
            contentFit="contain"
            transition={200}
          />
        </View>
      )}

      {/* 4. PIE DE PÁGINA (Botones de Interacción) */}
      <View className="flex-row items-center p-4">
        {/* Like */}
        <Pressable className="mr-6 flex-row items-center">
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={24}
            color={isLiked ? "#30C2D9" : "#8A8A8E"}
          />
          <Text className="ml-2 font-spartan text-base text-gray-500 dark:text-gray-400">
            {likesCount}
          </Text>
        </Pressable>

        {/* Comentarios */}
        <Pressable
          className="flex-row items-center"
          onPress={() => setCommentsModalVisible(true)}
        >
          <Ionicons name="chatbubble-outline" size={22} color="#8A8A8E" />
          <Text className="ml-2 font-spartan text-base text-gray-500 dark:text-gray-400">
            {commentsCount}
          </Text>
        </Pressable>

        {/* NUEVO: Botón Compartir */}
        <Pressable className="ml-6 flex-row items-center">
          <Ionicons name="share-social-outline" size={22} color="#8A8A8E" />
        </Pressable>
      </View>

      {/* MODAL DE COMENTARIOS */}
      <CommentsModal
        isVisible={isCommentsModalVisible}
        onClose={() => setCommentsModalVisible(false)}
        comments={comments}
        onAddComment={onAddComment}
      />

      {/* NUEVO: Modal de opciones separado */}
      <PostOptionsModal
        visible={isMenuVisible}
        onClose={() => setMenuVisible(false)}
        onEdit={() => console.log("Lógica para editar post")}
        onDelete={() => console.log("Lógica para eliminar post")}
      />
    </View>
  );
}
