import React, { useEffect, useState } from "react";
import { View, Text, Pressable, useColorScheme } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import PostOptionsModal from "./post-options-modal";
import CommentsModal from "./CommentsModal";
import { CommentType } from "./CommentItem";
import ProfileIcon from "./ProfileIcon";
import { toggleLikePost, toggleLikeFragment } from "@/services/supabase/interactions/likes";
import { PublicationTarget } from "@/services/supabase/interactions/types";
import ShareChatModal from "./share-chat-modal";

type FeedCardPublicationType = "post" | "fragment";

interface FeedCardProps {
  publicationId?: string;
  publicationType?: FeedCardPublicationType;
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
  onDeleted?: () => void;
  onEdited?: (content: string) => void;
}

export default function FeedCard({
  publicationId,
  publicationType,
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
  onAddComment,
  onDeleted,
  onEdited,
}: FeedCardProps) {
  const [isCommentsModalVisible, setCommentsModalVisible] = useState(false);
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);

  const [liked, setLiked] = useState(isLiked);
  const [count, setCount] = useState(likesCount);
  const [isTogglingLike, setIsTogglingLike] = useState(false);

  const [commentCount, setCommentCount] = useState(commentsCount);

  const target: PublicationTarget = publicationType === "fragment"
    ? { fragmentId: publicationId! }
    : { postId: publicationId! };

  // ✅ Hook siempre en el nivel superior, nunca en condicional
  const isDark = useColorScheme() === "dark";

  // ✅ Lógica del avatar en una variable, sin duplicar el componente
  const hasImage =
    authorImage && typeof authorImage === "string" && authorImage.trim() !== "";

  const handleLike = async () => {
    if (!publicationId || isTogglingLike) return;

    // Actualizar UI
    const prevLiked = liked;
    const prevCount = count;
    setLiked(!liked);
    setCount(prev => liked ? prev-1 : prev+1);
    setIsTogglingLike(true);

    const toggle = publicationType === "fragment"
      ? toggleLikeFragment
      : toggleLikePost;

    const { data, error } = await toggle(publicationId);

    if (error || !data) {
      setLiked(prevLiked);
      setCount(prevCount);
    } else {
      setLiked(data.liked);
      setCount(data.count);
    }

    setIsTogglingLike(false);
  }

  useEffect(() => {
    setCommentCount(commentsCount);
  }, [commentsCount]);

  // Lo mismo para likes por consistencia:
  useEffect(() => {
    setLiked(isLiked);
    setCount(likesCount);
  }, [isLiked, likesCount]);

  return (
    <View className="mb-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-transparent dark:bg-background-semidark">
      {/* 1. CABECERA */}
      <View className="flex-row items-start justify-between p-4">
        <View className="flex-row items-start flex-1">
          {/* LÓGICA DE CONSISTENCIA DEL AVATAR */}
          <ProfileIcon
            initials={authorInitials}
            profilePic={authorImage}
            isDark={isDark}
            size={48}
          />
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

      {/* 2. TEXTO */}
      <View className="px-4 pb-3">
        <Text className="font-spartan text-base leading-6 text-black dark:text-white">
          {textContent}
        </Text>
      </View>

      {/* 3. IMAGEN */}
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

      {/* 4. FOOTER */}
      <View className="flex-row items-center p-4">
        {/* Like */}
        <Pressable className="mr-6 flex-row items-center" onPress={ handleLike } disabled={ isTogglingLike }>
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={24}
            color={liked ? "#30C2D9" : "#8A8A8E"}
          />
          <Text className="ml-2 font-spartan text-base text-gray-500 dark:text-gray-400">
            {count}
          </Text>
        </Pressable>

        {/* Comentarios */}
        <Pressable
          className="flex-row items-center"
          onPress={() => setCommentsModalVisible(true)}
        >
          <Ionicons name="chatbubble-outline" size={22} color="#8A8A8E" />
          <Text className="ml-2 font-spartan text-base text-gray-500 dark:text-gray-400">
            {commentCount}
          </Text>
        </Pressable>

        {/* NUEVO: Botón Compartir */}
        <Pressable className="ml-6 flex-row items-center" onPress={() => setShareVisible(true)}>
          <Ionicons name="share-social-outline" size={22} color="#8A8A8E" />
        </Pressable>
      </View>

      {/* MODAL DE COMENTARIOS */}
      <CommentsModal
        isVisible={isCommentsModalVisible}
        onClose={() => setCommentsModalVisible(false)}
        target={target}
        onCommentAdded={() => setCommentCount(prev => prev + 1)}
      />

      {/* NUEVO: Modal de opciones separado */}
      <PostOptionsModal
        visible={isMenuVisible}
        onClose={() => setMenuVisible(false)}
        publicationId={publicationId}
        publicationType={publicationType}
        initialContent={textContent}
        onDeleted={onDeleted}
        onEdited={onEdited}
        onEdit={() => console.log("Lógica para editar post")}
      />

    {/* MODAL DE SHARE */}
      <ShareChatModal 
        visible={shareVisible}
        onClose={() => setShareVisible(false)} 
        target={target} 
        onShared={(shared) => {
        }}        
      />
    </View>
  );
}
