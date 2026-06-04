import React, { useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

// Importación de nuestros componentes personalizados de UI
import FriendframeHeader from "@/components/ui/FriendframeHeader";
import FeedCard from "@/components/ui/FeedCard";
import { FeedSkeletonList } from "@/components/ui/FeedCardSkeleton";
import { useFeed } from "@/hooks/useFeed";
import { FeedPost } from "@/services/supabase/feed/feed.types";
import { FeedItem } from "@/services/supabase/posts/types";

//  Helpers
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

//  Estado vacío
function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-20">
      <Ionicons name="newspaper-outline" size={56} color="#9CA3AF" />
      <Text className="mt-4 font-spartan-bold text-xl text-gray-700 dark:text-gray-300 text-center">
        Tu feed está vacío
      </Text>
      <Text className="mt-2 font-spartan text-sm text-gray-500 dark:text-gray-400 text-center leading-5">
        Sigue a personas para ver sus publicaciones y fragmentos aquí.
      </Text>
      <Pressable
        onPress={onRefresh}
        className="mt-6 rounded-full bg-cyan-500 px-6 py-3"
      >
        <Text className="font-spartan-bold text-white text-sm">Actualizar</Text>
      </Pressable>
    </View>
  );
}

//  Estado de error
function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-20">
      <Ionicons name="cloud-offline-outline" size={56} color="#EF4444" />
      <Text className="mt-4 font-spartan-bold text-xl text-gray-700 dark:text-gray-300 text-center">
        Algo salió mal
      </Text>
      <Text className="mt-2 font-spartan text-sm text-gray-500 dark:text-gray-400 text-center leading-5">
        {message}
      </Text>
      <Pressable
        onPress={onRetry}
        className="mt-6 rounded-full bg-cyan-500 px-6 py-3"
      >
        <Text className="font-spartan-bold text-white text-sm">Reintentar</Text>
      </Pressable>
    </View>
  );
}

//  Footer: spinner de paginación / fin de lista
function ListFooter({
  isFetchingMore,
  hasMore,
}: {
  isFetchingMore: boolean;
  hasMore: boolean;
}) {
  if (isFetchingMore) {
    return (
      <View className="items-center py-6">
        <ActivityIndicator size="small" color="#30C2D9" />
      </View>
    );
  }
  if (!hasMore) {
    return (
      <View className="items-center py-8">
        <Text className="font-spartan text-sm text-gray-400 dark:text-gray-500">
          Has llegado al final 🎉
        </Text>
      </View>
    );
  }
  return null;
}

//  Pantalla principal
export default function FeedScreen() {
  // Detecta si el celular del usuario está en modo oscuro para adaptar los colores
  const isDark = useColorScheme() === "dark";

  const {
    items,
    isLoading,
    isFetchingMore,
    error,
    hasMore,
    refresh,
    fetchMore,
  } = useFeed();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, []),
  );

  // Adaptador: convierte FeedPost → props de FeedCard
  const renderItem = useCallback(({ item }: { item: FeedPost }) => {
    const isFragment = item.type === "fragment";

    return (
      <FeedCard
        // Publication
        publicationId={item.id}
        publicationType={item.type}
        // Autor
        authorName={item.author.full_name}
        authorInitials={initials(item.author.full_name)}
        authorImage={item.author.profile_pic ?? null}
        timeAgo={timeAgo(item.created_at)}
        // Perfil receptor
        targetProfileName={item.account_owner.full_name}
        targetUserImage={item.account_owner.profile_pic ?? null}
        // Contenido — fragments usan .content, posts usan .description
        textContent={
          isFragment ? (item.content ?? "") : (item.description ?? "")
        }
        // Imagen solo en posts
        imageSource={
          !isFragment && item.media ? { uri: item.media } : undefined
        }
        // Interacciones
        likesCount={item.likes_count}
        commentsCount={item.comments_count}
        isLiked={item.liked_by_me}
        // TODO: reemplazar con currentUserId desde tu contexto de auth
        isOwnPost={false}
        // Comentarios: por ahora vacíos hasta conectar el endpoint
        comments={[]}
        onAddComment={(texto) => {
          // TODO: conectar con acción de comentar
          console.log("comentario en", item.id, texto);
        }}
      />
    );
  }, []);

  const keyExtractor = useCallback((item: FeedPost) => item.id, []);

  const handleEndReached = useCallback(() => {
    if (!isFetchingMore && hasMore) fetchMore();
  }, [isFetchingMore, hasMore, fetchMore]);

  // Carga inicial → Skeletons
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background-light dark:bg-background-semidark">
        <FriendframeHeader isDark={isDark} />
        <View className="flex-1 bg-gray-50 dark:bg-background-dark px-4 pt-4">
          <FeedSkeletonList count={4} />
        </View>
      </SafeAreaView>
    );
  }

  // Error sin datos
  if (error && items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background-light dark:bg-background-semidark">
        <FriendframeHeader isDark={isDark} />
        <ErrorState message={error} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  // Feed vacío
  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background-light dark:bg-background-semidark">
        <FriendframeHeader isDark={isDark} />
        <EmptyState onRefresh={refresh} />
      </SafeAreaView>
    );
  }

  // Feed con datos
  return (
    // SafeAreaView protege el contenido para que no quede debajo de la muesca del iPhone o la barra de estado
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-semidark">
      {/* Componente que muestra el logo de FriendFrame en la parte superior */}
      <FriendframeHeader isDark={isDark} />

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        className="flex-1 bg-gray-50 dark:bg-background-dark"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 40,
          maxWidth: 672, // equivale a max-w-2xl
          alignSelf: "center",
          width: "100%",
        }}
        showsVerticalScrollIndicator={false}
        // Pull-to-refresh
        onRefresh={refresh}
        refreshing={isLoading}
        // Infinite scroll
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        // Footer
        ListFooterComponent={
          <ListFooter isFetchingMore={isFetchingMore} hasMore={hasMore} />
        }
        // Rendimiento
        removeClippedSubviews
        maxToRenderPerBatch={8}
        windowSize={10}
        initialNumToRender={6}
      />
    </SafeAreaView>
  );
}
