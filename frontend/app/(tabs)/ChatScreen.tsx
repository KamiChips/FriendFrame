import ChatHeader from "@/components/ui/ChatHeader";
import ChatMessage from "@/components/ui/ChatMessage";
import ChatMessageInput from "@/components/ui/ChatMessageInput";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  useColorScheme,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";
import { useAuth } from "@/context/AuthContext";
import { useLocalSearchParams } from "expo-router";
import { Message } from "@/services/supabase/chat/chat.types";
import {
  getMessages,
  sendMessage,
} from "@/services/supabase/chat/chat.messages";
import { subscribeToMessages } from "@/services/supabase/chat/chat.realtime";

const ChatScreen = () => {
  const isDark = useColorScheme() === "dark";
  const scrollRef = useRef<ScrollView>(null);
  const { user } = useAuth();

  const { chatId, chatName, chatInitials, isGroup, targetUserId } =
    useLocalSearchParams<{
      chatId: string;
      chatName: string;
      chatInitials: string;
      isGroup: string;
      targetUserId?: string;
    }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);

  useEffect(() => {
    if (!chatId) return;

    const load = async () => {
      setLoading(true);
      const { data } = await getMessages(chatId, { page: 0, limit: 30 });
      if (data) {
        setMessages(data.slice().reverse());
        setHasMore(data.length === 30);
      }

      setLoading(false);
      setTimeout(
        () => scrollRef.current?.scrollToEnd({ animated: false }),
        100,
      );
    };

    load();
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;

    const unsub = subscribeToMessages(chatId, (newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.message_id === newMsg.message_id)) return prev;
        return [...prev, newMsg];
      });

      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    });

    return unsub;
  }, [chatId]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !chatId) return;
    setLoading(true);
    pageRef.current += 1;

    const { data } = await getMessages(chatId, {
      page: pageRef.current,
      limit: 30,
    });

    if (data) {
      setMessages((prev) => [...data.slice().reverse(), ...prev]);
      setHasMore(data.length === 30);
    }

    setLoading(false);
  }, [chatId, loadingMore, hasMore]);

  const handleSend = async (text: string) => {
    if (!user || !chatId || !text.trim()) return;

    const tempId = `temp-${Date.now()}`;

    const optimistic: Message = {
      message_id: tempId,
      chat_id: chatId,
      sender_id: user.user_id,
      content: text.trim(),
      is_read: false,
      created_at: new Date().toISOString(),
      sender: {
        user_id: user.user_id,
        username: user.username,
        full_name: user.full_name,
        profile_pic: user.profile_pic,
      },
      shared_post: null,
      shared_fragment: null,
    };

    setMessages((prev) => [...prev, optimistic]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);

    const { data, error } = await sendMessage(chatId, text.trim());

    if (error) {
      setMessages((prev) => prev.filter((m) => m.message_id !== tempId));
    } else if (data) {
      setMessages((prev) =>
        prev.map((m) => (m.message_id === tempId ? data : m)),
      );
    }
  };
  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#1a1a1a" : "#ffffff"}
      />
      <ChatHeader
        isDark={isDark}
        username={chatName ?? "Chat"}
        initials={chatInitials ?? ""}
        lastActive="En línea"
      />

      <View className="flex-1 bg-gray-50 pt-5 pb-3 dark:bg-background-semidark">
        {loading ? (
          <ActivityIndicator color="#30C2D9" className="mt-10" />
        ) : (
          <ScrollView
            ref={scrollRef}
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            onScroll={({ nativeEvent }) => {
              // Cargar más cuando el usuario sube al tope
              if (nativeEvent.contentOffset.y < 50) handleLoadMore();
            }}
            scrollEventThrottle={200}
          >
            {/* Indicador de carga de mensajes anteriores */}
            {loadingMore && (
              <ActivityIndicator color="#30C2D9" className="mb-4" />
            )}

            {/* Mensajes */}
            {messages.map((m) => (
              <ChatMessage
                key={m.message_id}
                message={m.content}
                media={(m as any).media}
                time={new Date(m.created_at).toLocaleTimeString("es-MX", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                sender={m.sender_id === user?.user_id ? "me" : "other"}
                initials={m.sender.full_name?.charAt(0).toUpperCase() ?? "?"}
                isDark={isDark}
              />
            ))}
          </ScrollView>
        )}
      </View>

      <ChatMessageInput onSend={handleSend} isDark={isDark} />
    </SafeAreaView>
  );
};

export default ChatScreen;
