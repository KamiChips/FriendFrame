import { supabase } from "@/lib/supabase/client";
import { assertUUID, getAuthUser } from "../helpers/validation";
import { assertFriendship, assertMembership, parseError } from "./chat.helpers";
import { ChatResult } from "./chat.types";

//Aniadir a un amigo a un grupo que ya existe
export async function addMemberToGroup(
  chatId: string,
  newUserId: string,
): Promise<ChatResult> {
  try {
    assertUUID(chatId, "chatId");
    assertUUID(newUserId, "ID de usuario");
    const currentUserId = await getAuthUser();

    const { data: chat } = await supabase
      .from("chat")
      .select("is_group")
      .eq("chat_id", chatId)
      .single();
    if (!chat?.is_group)
      throw new Error("Solo puedes añadir miembros a grupos.");

    await assertMembership(chatId, currentUserId);
    await assertFriendship(currentUserId, newUserId);

    const { error } = await supabase
      .from("chat_members")
      .insert({ chat_id: chatId, user_id: newUserId });

    if (error) throw error;
    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
}

//El usuario se sale del grupo
export async function leaveGroup(chatId: string): Promise<ChatResult> {
  try {
    assertUUID(chatId, "chatId");
    const currentUserId = await getAuthUser();

    const { error } = await supabase
      .from("chat_members")
      .delete()
      .eq("chat_id", chatId)
      .eq("user_id", currentUserId);

    if (error) throw error;
    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
}
