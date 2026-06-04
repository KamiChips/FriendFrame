import {
  ScrollView,
  StatusBar,
  Text,
  View,
  useColorScheme,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import "../../global.css";
import ChatCard from "@/components/ui/ChatCard";
import FriendframeHeader from "@/components/ui/FriendframeHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useCallback, useEffect, useState } from "react";
import {
  createDirectChat,
  getConversations,
} from "@/services/supabase/chat/chat.conversation";
import { subscribeToChatList } from "@/services/supabase/chat/chat.realtime";
import { Chat } from "@/services/supabase/chat/chat.types";

const ChatInboxScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { user } = useAuth();

  const { targetUserId } = useLocalSearchParams<{ targetUserId?: string }>();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  const loadChats = useCallback(async () => {
    const { data } = await getConversations();
    if (data) setChats(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadChats();
    const unsub = subscribeToChatList(loadChats);
    return unsub;
  }, [loadChats]);

  useEffect(() => {
    console.log("targetUserId recibido:", targetUserId);
    console.log("user:", user?.user_id);
    if (!targetUserId || !user) {
      console.log("Sin targetUserId o user, no hace nada");

      return;
    }

    const openOrCreate = async () => {
      console.log("Llamando createDirectChat con:", targetUserId);

      const { data, error } = await createDirectChat(targetUserId);
      console.log("Resultado createDirectChat:", {
        data: data?.chat_id,
        error,
      });

      if (error || !data) return;

      const otherMember = data.members.find((m) => m.user_id !== user.user_id);
      const chatName = data.is_group
        ? (data.group_name ?? "Grupo")
        : (otherMember?.full_name ?? "Chat");
      const chatInitials = chatName
        .split(" ")
        .map((w: string) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

      console.log("Navegando a:", data.chat_id);

      router.navigate({
        pathname: "/ChatScreen",
        params: {
          chatId: data.chat_id,
          chatName,
          chatInitials,
          isGroup: String(data.is_group),
          targetUserId: otherMember?.user_id ?? "",
        },
      });
    };

    openOrCreate();
  }, [targetUserId, user]);

  const formatTime = (isoDate: string): string => {
    const date = new Date(isoDate);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);

    if (mins < 1) return "Ahora";
    if (mins < 60) return `hace ${mins} min`;
    if (mins < 1440)
      return date.toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
      });
    return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  };

  return (
    <SafeAreaView
      className={`flex-1 bg-background-light ${isDark ? "dark" : ""} dark:bg-background-semidark `}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#1a1a1a" : "#fafafa"}
      />

      {/* Header */}
      <FriendframeHeader isDark={isDark} />

      {/* Inbox */}
      <View className="flex-1 bg-gray-50 dark:bg-background-dark">
        {/* --- HEADER DE MENSAJES CON BOTÓN DE CREAR GRUPO --- */}
        <View className="flex-row justify-between items-center px-4 pt-5 pb-3">
          <Text className="font-spartan-bold text-2xl text-[#1a1a1a] dark:text-background-light">
            Mensajes
          </Text>

          {/* Link para abrir el modal transparente */}
          <Link href="/CreateGroup" asChild>
            <TouchableOpacity className="p-1">
              <Ionicons
                name="people-outline"
                size={28}
                color={isDark ? "#FF9B42" : "#30C2D9"}
              />
            </TouchableOpacity>
          </Link>
        </View>

        {loading ? (
          <ActivityIndicator color="#30C2D9" className="mt-10" />
        ) : chats.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-gray-400 dark:text-gray-500 text-center font-spartan">
              No tienes conversaciones todavía.{"\n"}
              Sigue a alguien y empieza a chatear.
            </Text>
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {chats.map((chat) => {
              console.log("chat_id:", chat.chat_id);
              console.log("members:", chat.members);
              console.log("user_id:", user?.user_id);
              // Para chat 1 a 1 el nombre es el del otro miembro
              const otherMember = chat.members.find(
                (m) => m.user_id !== user?.user_id,
              );
              console.log("otherMember:", otherMember);

              const chatName = chat.is_group
                ? (chat.group_name ?? "Grupo")
                : (otherMember?.full_name ?? "Chat");
              const initials = chatName
                .split(" ")
                .map((w: string) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              const profilePic = chat.is_group
                ? null
                : (otherMember?.profile_pic ?? null);
              const targetId = chat.is_group
                ? null
                : (otherMember?.user_id ?? null);

              return (
                <ChatCard
                  key={chat.chat_id}
                  id={chat.chat_id}
                  initials={initials}
                  name={chatName}
                  profilePic={profilePic}
                  message={chat.last_message?.content ?? "Sin mensajes"}
                  time={
                    chat.last_message?.created_at
                      ? formatTime(chat.last_message.created_at)
                      : ""
                  }
                  unread={chat.unread_count > 0}
                  unreadCount={chat.unread_count}
                  isDark={isDark}
                  targetUserId={targetId}
                  onPress={() => {
                    console.log("ChatCard presionado, targetId:", targetId);

                    router.push({
                      pathname: "/ChatScreen",
                      params: {
                        chatId: chat.chat_id,
                        chatName,
                        chatInitials: initials,
                        isGroup: String(chat.is_group),
                        targetUserId: targetId ?? "",
                      },
                    });
                  }}
                />
              );
            })}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

export default ChatInboxScreen;
