// context/ChatContext.tsx
// Coloca este archivo en: context/ChatContext.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { getConversations } from "@/services/supabase/chat/chat.conversation";
import { getTotalUnreadMessages } from "@/services/supabase/chat/chat.messages";
import { subscribeToChatList } from "@/services/supabase/chat/chat.realtime";

interface ChatBadgeContextValue {
  unreadMessages: number;
  refreshBadge: () => Promise<void>;
}

const ChatBadgeContext = createContext<ChatBadgeContextValue | null>(null);

export function ChatBadgeProvider({ children }: { children: React.ReactNode }) {
  const [unreadMessages, setUnreadMessages] = useState(0);

  const refreshBadge = useCallback(async () => {
    const { data } = await getTotalUnreadMessages();
    if (data !== null) setUnreadMessages(data);
  }, []);

  useEffect(() => {
    // Carga inicial
    refreshBadge();

    // Realtime — actualiza el badge cuando llega un mensaje nuevo
    const unsub = subscribeToChatList(refreshBadge);
    return unsub;
  }, [refreshBadge]);

  return (
    <ChatBadgeContext.Provider value={{ unreadMessages, refreshBadge }}>
      {children}
    </ChatBadgeContext.Provider>
  );
}

export function useChatBadge(): ChatBadgeContextValue {
  const ctx = useContext(ChatBadgeContext);
  if (!ctx)
    throw new Error("useChatBadge debe usarse dentro de <ChatBadgeProvider>");
  return ctx;
}
