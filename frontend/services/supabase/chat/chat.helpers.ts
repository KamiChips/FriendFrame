import { supabase } from "@/lib/supabase/client";
import {
  Chat,
  ChatMember,
  DEFAULT_MSG_LIMIT,
  MAX_PAGE_LIMIT,
} from "./chat.types";
import { UUID_REGEX } from "../helpers/validation";

export function assertUUIDs(values: string[], label = "ID"): void {
  values.forEach((v, i) => {
    if (!UUID_REGEX.test(v)) throw new Error(`${label}[${i}] inválido.`);
  });
}

export function normalizePagination(
  page = 0,
  limit = DEFAULT_MSG_LIMIT,
): { from: number; to: number } {
  const p = Math.max(0, Math.floor(page));
  const l = Math.min(MAX_PAGE_LIMIT, Math.max(1, Math.floor(limit)));
  return { from: p * l, to: p * l + l - 1 };
}

export function parseError(err: unknown): string {
  if (!err) return "Error desconocido";
  const msg = (err as Error).message ?? String(err);

  const known: [string, string][] = [
    ["row-level security", "No tienes permiso para acceder a este chat."],
    ["duplicate key", "Ya eres miembro de este chat."],
    ["violates foreign key", "El usuario o chat no existe."],
    ["NetworkError", "Error de red. Verifica tu conexión."],
    ["Failed to fetch", "Error de red. Verifica tu conexión."],
  ];

  for (const [key, value] of known) {
    if (msg.includes(key)) return value;
  }

  if (
    msg.startsWith("No hay sesión") ||
    msg.startsWith("No puedes") ||
    msg.startsWith("Solo puedes") ||
    msg.startsWith("El grupo") ||
    msg.startsWith("El mensaje") ||
    msg.startsWith("Agrega") ||
    msg.startsWith("Selecciona") ||
    msg.startsWith("Máximo") ||
    msg.includes("inválido")
  )
    return msg;

  return "Ocurrió un error inesperado.";
}

//Helpers internos
//Verifica amistad
export async function assertFriendship(
  userId1: string,
  userId2: string,
): Promise<void> {
  const { data, error } = (await supabase.rpc("assert_friendship_rpc", {
    user_a: userId1,
    user_b: userId2,
  })) as { data: boolean | null; error: any };

  if (error) throw error;
  if (!data) throw new Error("Solo puedes iniciar chats con tus amigos.");
}

//Verifica si es miembro de un chat
export async function assertMembership(
  chatId: string,
  userId: string,
): Promise<void> {
  const { data } = await supabase
    .from("chat_members")
    .select("chat_members_id")
    .eq("chat_id", chatId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) throw new Error("No eres miembro de este chat.");
}

//Buscar un chat directo entre dos usuarios
export async function findExistingDirectChat(
  userId1: string,
  userId2: string,
): Promise<string | null> {
  const { data, error } = (await supabase.rpc("find_direct_chat", {
    user_a: userId1,
    user_b: userId2,
  })) as { data: string | null; error: any };

  if (error) throw error;
  return data ?? null;
}

//Obtener chat completo con miembros
export async function getChatById(
  chatId: string,
  currentUserId: string,
): Promise<Chat | null> {
  const { data, error } = await supabase
    .from("chat")
    .select(
      `
      chat_id, is_group, group_name, created_by, created_at,
      members:chat_members (
        joined_at,
        user:users!user_id ( user_id, full_name, username, profile_pic )
      )
    `,
    )
    .eq("chat_id", chatId)
    .single();

  if (error) return null;

  const [lastMsgRes, unreadRes] = await Promise.all([
    supabase
      .from("messages")
      .select(
        "content, sender_id, created_at, sender:users!sender_id(username)",
      )
      .eq("chat_id", chatId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("chat_id", chatId)
      .eq("is_read", false)
      .neq("sender_id", currentUserId),
  ]);

  const members: ChatMember[] = (data.members ?? []).map((m: any) => ({
    ...m.user,
    joined_at: m.joined_at,
  }));

  const lastMsg = lastMsgRes.data;
  return {
    chat_id: data.chat_id,
    is_group: data.is_group,
    group_name: data.group_name,
    created_by: data.created_by,
    created_at: data.created_at,
    members,
    last_message: lastMsg
      ? {
          content: lastMsg.content,
          sender_id: lastMsg.sender_id,
          created_at: lastMsg.created_at,
          sender_username: (lastMsg.sender as any)?.username ?? "",
        }
      : null,
    unread_count: unreadRes.count ?? 0,
  };
}

export function notifyMembers(
  chatId: string,
  senderId: string,
  messageId: string,
): void {
  Promise.resolve(
    supabase
      .from("chat_members")
      .select("user_id")
      .eq("chat_id", chatId)
      .neq("user_id", senderId),
  )
    .then(({ data: members }) => {
      if (!members?.length) return;
      Promise.resolve(
        supabase.from("notifications").insert(
          members.map((m: any) => ({
            user_id: m.user_id,
            type: "new_message",
            actor_id: senderId,
            message_id: messageId,
          })),
        ),
      ).catch(() => {});
    })
    .catch(() => {});
}

export async function markMessagesAsRead(
  chatId: string,
  userId: string,
): Promise<void> {
  const { error, count } = await supabase
    .from("messages")
    .update({ is_read: true }, { count: "exact" })
    .eq("chat_id", chatId)
    .eq("is_read", false)
    .neq("sender_id", userId);

  console.log("markMessagesAsRead:", { chatId, userId, error, count });
}
