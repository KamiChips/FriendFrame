import { supabase } from "@/lib/supabase/client";
import { assertUUID, getAuthUser } from "../helpers/validation";
import {
  assertMembership,
  assertUUIDs,
  markMessagesAsRead,
  normalizePagination,
  notifyMembers,
  parseError,
} from "./chat.helpers";
import {
  ChatResult,
  DEFAULT_MSG_LIMIT,
  MAX_MESSAGE_LEN,
  MAX_PREVIEW_LEN,
  MAX_SHARE_CHATS,
  Message,
  PaginationParams,
  ShareTarget,
} from "./chat.types";

export async function sendMessage(
  chatId: string,
  content: string,
): Promise<ChatResult<Message>> {
  try {
    assertUUID(chatId, "chatId");
    const currentUserId = await getAuthUser();

    const trimmed = content.trim();
    if (!trimmed) throw new Error("El mensaje no puede estar vacío.");
    if (trimmed.length > MAX_MESSAGE_LEN)
      throw new Error(
        `El mensaje no puede superar ${MAX_MESSAGE_LEN} caracteres.`,
      );

    await assertMembership(chatId, currentUserId);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        chat_id: chatId,
        sender_id: currentUserId,
        content: trimmed,
        is_read: false,
      })
      .select(
        `
        *,
        sender:users!sender_id (
          user_id, username, full_name, profile_pic
        )
      `,
      )
      .single();

    if (error) throw error;

    notifyMembers(chatId, currentUserId, data.message_id);

    return {
      data: { ...data, shared_post: null, shared_fragment: null } as Message,
      error: null,
    };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
}

//Obtiene los mensajes ed un chat
export async function getMessages(
  chatId: string,
  { page = 0, limit = DEFAULT_MSG_LIMIT }: PaginationParams = {},
): Promise<ChatResult<Message[]>> {
  try {
    assertUUID(chatId, "chatId");
    const currentUserId = await getAuthUser();
    const { from, to } = normalizePagination(page, limit);

    const { data, error } = await supabase
      .from("messages")
      .select(
        `
        *,
        sender:users!sender_id (
          user_id, username, full_name, profile_pic
        )
      `,
      )
      .eq("chat_id", chatId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    markMessagesAsRead(chatId, currentUserId);

    return {
      data: (data ?? []).map((m) => ({
        ...m,
        shared_post: null,
        shared_fragment: null,
      })) as Message[],
      error: null,
    };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
}

//compartir fragment o pos a uno o pueden ser varios chats
export async function shareToChat(
  target: ShareTarget,
  chatIds: string[],
): Promise<ChatResult<{ shared: number; failed: number }>> {
  try {
    const currentUserId = await getAuthUser();

    const targetId = target.postId ?? target.fragmentId;
    if (!targetId) throw new Error("Se requiere postId o fragmentId.");
    assertUUID(targetId, target.postId ? "postId" : "fragmentId");

    if (chatIds.length === 0) throw new Error("Selecciona al menos un chat.");
    if (chatIds.length > MAX_SHARE_CHATS)
      throw new Error(`Máximo ${MAX_SHARE_CHATS} chats por compartir.`);

    assertUUIDs(chatIds, "chatId");

    let previewText = "";
    if (target.postId) {
      const { data: post } = await supabase
        .from("posts")
        .select("description")
        .eq("post_id", target.postId)
        .maybeSingle();
      previewText = post?.description
        ? `📷 ${post.description.slice(0, MAX_PREVIEW_LEN)}`
        : "📷 Publicación compartida";
    } else {
      const { data: fragment } = await supabase
        .from("fragments")
        .select("content")
        .eq("fragment_id", target.fragmentId!)
        .maybeSingle();
      previewText = fragment?.content
        ? `📝 ${fragment.content.slice(0, MAX_PREVIEW_LEN)}`
        : "📝 Fragment compartido";
    }

    const results = await Promise.allSettled(
      chatIds.map(async (chatId) => {
        await assertMembership(chatId, currentUserId);

        await Promise.all([
          supabase.from("shares").insert({
            user_id: currentUserId,
            post_id: target.postId ?? null,
            fragment_id: target.fragmentId ?? null,
            chat_id: chatId,
          }),
          supabase.from("messages").insert({
            chat_id: chatId,
            sender_id: currentUserId,
            content: previewText,
            is_read: false,
          }),
        ]);
      }),
    );

    return {
      data: {
        shared: results.filter((r) => r.status === "fulfilled").length,
        failed: results.filter((r) => r.status === "rejected").length,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
}

//total de mensajes no leidos en todos los chats del usuario
export async function getTotalUnreadMessages(): Promise<ChatResult<number>> {
  try {
    const currentUserId = await getAuthUser();

    const { data, error } = (await supabase.rpc("get_total_unread_messages", {
      p_user_id: currentUserId,
    })) as { data: number | null; error: any };

    if (error) throw error;
    return { data: Number(data ?? 0), error: null };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
}
