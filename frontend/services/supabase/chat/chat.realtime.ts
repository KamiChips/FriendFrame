import { supabase } from "@/lib/supabase/client";
import { UUID_REGEX } from "../helpers/validation";
import { Message } from "./chat.types";
import { RealtimeChannel } from "@supabase/supabase-js";

//Recibes los nuevos mensajes de caht
export function subscribeToMessages(
  chatId: string,
  onNew: (message: Message) => void,
): () => void {
  if (!UUID_REGEX.test(chatId)) return () => {};

  const channel = supabase
    .channel(`chat-${chatId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `chat_id=eq.${chatId}`,
      },
      async (payload) => {
        const { data } = await supabase
          .from("messages")
          .select(
            `*, sender:users!sender_id ( user_id, username, full_name, profile_pic )`,
          )
          .eq("message_id", payload.new.message_id)
          .single();

        if (data)
          onNew({
            ...data,
            shared_post: null,
            shared_fragment: null,
          } as Message);
      },
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

//Nos permite tener el inbox actualizado cuando llegan nuevos mensajes
export function subscribeToChatList(onUpdate: () => void): () => void {
  let channel: RealtimeChannel | null = null;

  supabase.auth.getUser().then(({ data: { user } }) => {
    if (!user) return;
    channel = supabase
      .channel(`inbox-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        onUpdate,
      )
      .subscribe();
  });

  return () => {
    if (channel) supabase.removeChannel(channel);
  };
}
