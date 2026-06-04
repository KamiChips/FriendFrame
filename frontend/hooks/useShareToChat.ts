import { useState, useCallback } from "react";
import { getFriends } from "@/services/supabase/profile/social";
import { shareToChat } from "@/services/supabase/chat/chat.messages";
// Importamos la función que buscará o creará los chats (la haremos en el paso 2)
import { createDirectChat } from "@/services/supabase/chat/chat.conversation";
import type { ShareTarget } from "@/services/supabase/chat/chat.types";
import type { SocialUser } from "@/services/supabase/social/social.types";
import { useAuth } from "@/context/AuthContext";

export function useShareToChat() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<SocialUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getErrorMessage = (value: unknown) => {
    if (!value) return null;
    if (typeof value === "string") return value;
    if (value instanceof Error) return value.message;
    return String(value);
  };

  const loadFriends = useCallback(async () => {
    const userId = (user as any)?.user_id ?? (user as any)?.id ?? (user as any)?.sub;
    if (!userId) return;

    setLoading(true);
    setError(null);
    const { data, error } = await getFriends(userId);
    
    if (error) {
      setError(getErrorMessage(error));
    } else {
      const mappedFriends = (data ?? []).map((profile: any) => ({
        ...profile,
        i_follow_them: true,
        is_friend: true,
      })) as SocialUser[];
      
      setFriends(mappedFriends);
    }
    
    setLoading(false);
  }, [user]);

  const share = useCallback(async (
    target: ShareTarget,
    userIds: string[], // <-- Ahora recibimos los IDs de los amigos seleccionados
  ) => {
    setSharing(true);
    setError(null);

    try {
      const resolvedChatIds: string[] = [];

      // 1. Por cada amigo seleccionado, buscamos o creamos el chat
      for (const friendId of userIds) {
        const { data: chat, error: chatError } = await createDirectChat(friendId);
        
        if (chatError || !chat) {
          console.warn(`No se pudo resolver el chat con ${friendId}`, chatError);
          continue; // Si falla uno, intentamos con el siguiente
        }
        
        resolvedChatIds.push(chat.chat_id);
      }

      if (resolvedChatIds.length === 0) {
        throw new Error("No se pudo iniciar ningún chat para compartir.");
      }

      // 2. Ahora sí, enviamos el post a los chats reales
      const { data, error } = await shareToChat(target, resolvedChatIds);
      
      if (error) throw error;
      
      setSharing(false);
      return data;
    } catch (err) {
      setSharing(false);
      setError(getErrorMessage(err));
      return null;
    }
  }, []);

  return { friends, loading, sharing, error, loadFriends, share };
}