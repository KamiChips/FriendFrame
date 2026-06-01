import { supabase } from "@/lib/supabase/client";
import { parseError } from "../helpers/errors";
import { assertUUID, getAuthUser } from "../helpers/validation";
import {
  NOTIFICATION_SELECT,
  assertNotificationType,
  normalizePagination,
} from "./notification.helpers";
import {
  AppNotification,
  DEFAULT_LIMIT,
  GetNotificationsParams,
  MAX_BATCH_IDS,
  NotificationCounts,
  NotificationsResult,
  NotificationType,
} from "./notification.types";

export function getNotificationText(notification: AppNotification): {
  title: string;
  body: string;
} {
  const name =
    notification.actor?.full_name ?? notification.actor?.username ?? "Alguien";

  const map: Record<NotificationType, { title: string; body: string }> = {
    new_follow: { title: "Nuevo seguidor", body: `${name} empezó a seguirte` },
    new_post: {
      title: "Nueva publicación en tu perfil",
      body: `${name} publicó una foto en tu perfil`,
    },
    new_fragment: {
      title: "Nuevo fragment en tu perfil",
      body: `${name} publicó un fragment en tu perfil`,
    },
    new_message: {
      title: "Nuevo mensaje",
      body: `${name}: ${notification.message?.content?.slice(0, 60) ?? ""}`,
    },
  };

  return map[notification.type] ?? { title: "Notificación", body: "" };
}

export async function getNotifications({
  page = 0,
  limit = DEFAULT_LIMIT,
  unread_only = false,
}: GetNotificationsParams = {}): Promise<
  NotificationsResult<AppNotification[]>
> {
  try {
    const currentUserId = await getAuthUser();
    const { from, to } = normalizePagination(page, limit);

    let query = supabase
      .from("notifications")
      .select(NOTIFICATION_SELECT)
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (unread_only) query = query.eq("is_read", false);

    const { data, error } = await query;
    if (error) throw error;

    return { data: data as unknown as AppNotification[], error: null };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
}

export async function getUnreadCount(): Promise<
  NotificationsResult<NotificationCounts>
> {
  try {
    const currentUserId = await getAuthUser();

    const { data, error } = (await supabase
      .rpc("get_unread_notification_counts", { p_user_id: currentUserId })
      .single()) as { data: any; error: any };

    if (error) throw error;

    return {
      data: {
        total: Number(data?.total_count ?? 0),
        follows: Number(data?.follows_count ?? 0),
        posts: Number(data?.posts_count ?? 0),
        messages: Number(data?.messages_count ?? 0),
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
}

export async function markAsRead(
  notificationId: string,
): Promise<NotificationsResult> {
  try {
    assertUUID(notificationId, "ID de notificación");
    const currentUserId = await getAuthUser();

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("notification_id", notificationId)
      .eq("user_id", currentUserId);

    if (error) throw error;
    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
}

export async function markMultipleAsRead(
  notificationIds: string[],
): Promise<NotificationsResult> {
  try {
    if (notificationIds.length === 0) return { data: null, error: null };

    if (notificationIds.length > MAX_BATCH_IDS) {
      return { data: null, error: `Máximo ${MAX_BATCH_IDS} IDs por lote.` };
    }

    // Validar todos los UUIDs antes de la query
    notificationIds.forEach((id, i) => assertUUID(id, `ID[${i}]`));

    const currentUserId = await getAuthUser();

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("notification_id", notificationIds)
      .eq("user_id", currentUserId);

    if (error) throw error;
    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
}

export async function markAllAsRead(): Promise<
  NotificationsResult<{ updated: number }>
> {
  try {
    const currentUserId = await getAuthUser();

    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", currentUserId)
      .eq("is_read", false)
      .select("notification_id"); // select mínimo para obtener el count

    if (error) throw error;

    return { data: { updated: data?.length ?? 0 }, error: null };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
}

export async function markTypeAsRead(
  type: NotificationType,
): Promise<NotificationsResult> {
  try {
    assertNotificationType(type);
    const currentUserId = await getAuthUser();

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", currentUserId)
      .eq("type", type)
      .eq("is_read", false);

    if (error) throw error;
    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
}

export async function deleteNotification(
  notificationId: string,
): Promise<NotificationsResult> {
  try {
    assertUUID(notificationId, "ID de notificación");
    const currentUserId = await getAuthUser();

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("notification_id", notificationId)
      .eq("user_id", currentUserId);

    if (error) throw error;
    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
}
