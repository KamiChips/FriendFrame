import { supabase } from "@/lib/supabase/client";
import { assertUUID, getAuthUser } from "../helpers/validation";
import {
  assertFriendship,
  assertUUIDs,
  findExistingDirectChat,
  getChatById,
  parseError,
} from "./chat.helpers";
import {
  Chat,
  ChatMember,
  ChatResult,
  MAX_GROUP_MEMBERS,
  MAX_GROUP_NAME_LEN,
} from "./chat.types";

//Crear chat de conversacion con un amigo
//en caso de que ya exisa se abre otra vez
export async function createDirectChat(
  targetUserId: string,
): Promise<ChatResult<Chat>> {
  try {
    assertUUID(targetUserId, "ID de usuario");
    const currentUserId = await getAuthUser();
    if (currentUserId === targetUserId)
      throw new Error("No puedes chatear contigo mismo.");

    await assertFriendship(currentUserId, targetUserId);

    const existingId = await findExistingDirectChat(
      currentUserId,
      targetUserId,
    );
    if (existingId) {
      const chat = await getChatById(existingId, currentUserId);
      if (chat) return { data: chat, error: null };
    }

    const { data: chatData, error: chatError } = await supabase
      .from("chat")
      .insert({ is_group: false, group_name: null, created_by: currentUserId })
      .select("chat_id")
      .single();

    if (chatError) throw chatError;

    const { error: membersError } = await supabase.from("chat_members").insert([
      { chat_id: chatData.chat_id, user_id: currentUserId },
      { chat_id: chatData.chat_id, user_id: targetUserId },
    ]);

    if (membersError) throw membersError;

    const chat = await getChatById(chatData.chat_id, currentUserId);
    return { data: chat, error: null };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
}

export async function createGroupChat(
  groupName: string,
  memberIds: string[],
): Promise<ChatResult<Chat>> {
  try {
    const currentUserId = await getAuthUser();

    const cleanName = groupName.trim();
    if (!cleanName) throw new Error("El grupo necesita un nombre.");
    if (cleanName.length > MAX_GROUP_NAME_LEN)
      throw new Error(
        `El nombre del grupo no puede superar ${MAX_GROUP_NAME_LEN} caracteres.`,
      );
    if (memberIds.length === 0) throw new Error("Agrega al menos un miembro.");
    if (memberIds.length > MAX_GROUP_MEMBERS - 1)
      throw new Error(
        `Máximo ${MAX_GROUP_MEMBERS - 1} miembros adicionales por grupo.`,
      );

    // Excluir al creador si está en la lista y validar UUIDs
    const uniqueIds = [
      ...new Set(memberIds.filter((id) => id !== currentUserId)),
    ];
    assertUUIDs(uniqueIds, "ID de miembro");

    // Verificar amistad con todos en paralelo
    await Promise.all(
      uniqueIds.map((id) => assertFriendship(currentUserId, id)),
    );

    const { data: chatData, error: chatError } = await supabase
      .from("chat")
      .insert({
        is_group: true,
        group_name: cleanName,
        created_by: currentUserId,
      })
      .select("chat_id")
      .single();

    if (chatError) throw chatError;

    const { error: membersError } = await supabase.from("chat_members").insert(
      [currentUserId, ...uniqueIds].map((uid) => ({
        chat_id: chatData.chat_id,
        user_id: uid,
      })),
    );

    if (membersError) throw membersError;

    const chat = await getChatById(chatData.chat_id, currentUserId);
    return { data: chat, error: null };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
}

//Obtener inbox del usuario: ordenado por mensaje mas reciente
export async function getConversations(): Promise<ChatResult<Chat[]>> {
  try {
    const currentUserId = await getAuthUser();

    //Para obtener todos los chats con last_message y unread_count
    const { data: rows, error } = (await supabase.rpc("get_inbox", {
      p_user_id: currentUserId,
    })) as { data: any[] | null; error: any };

    if (error) throw error;
    if (!rows || rows.length === 0) return { data: [], error: null };

    const chatIds = rows.map((r) => r.chat_id);

    // 1 query para todos los miembros de todos los chats
    const { data: allMembers, error: membersError } = await supabase
      .from("chat_members")
      .select(
        `
        chat_id,
        joined_at,
        user:users!user_id ( user_id, full_name, username, profile_pic )
      `,
      )
      .in("chat_id", chatIds);

    if (membersError) throw membersError;

    // Indexar miembros por chat_id
    const membersByChatId = new Map<string, ChatMember[]>();
    (allMembers ?? []).forEach((m: any) => {
      const list = membersByChatId.get(m.chat_id) ?? [];
      list.push({ ...m.user, joined_at: m.joined_at });
      membersByChatId.set(m.chat_id, list);
    });

    const chats: Chat[] = rows.map((r) => ({
      chat_id: r.chat_id,
      is_group: r.is_group,
      group_name: r.group_name,
      created_by: r.created_by,
      created_at: r.created_at,
      members: membersByChatId.get(r.chat_id) ?? [],
      last_message: r.last_msg_content
        ? {
            content: r.last_msg_content,
            sender_id: r.last_msg_sender,
            created_at: r.last_msg_at,
            sender_username: r.last_msg_username ?? "",
          }
        : null,
      unread_count: Number(r.unread_count ?? 0),
    }));

    return { data: chats, error: null };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
}
