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

    const channelName = `inbox-${user.id}`;

    // Eliminar canal existente con ese nombre antes de crear uno nuevo
    const existing = supabase
      .getChannels()
      .find((c) => c.topic === `realtime:${channelName}`);
    if (existing) supabase.removeChannel(existing);

    channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        onUpdate,
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_members",
          filter: `user_id=eq.${user.id}`,
        },
        onUpdate,
      )
      .subscribe();
  });

  return () => {
    if (channel) supabase.removeChannel(channel);
  };
}
