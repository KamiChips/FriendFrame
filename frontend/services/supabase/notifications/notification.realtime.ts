import { supabase } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import { NOTIFICATION_SELECT } from "./notification.helpers";
import { getUnreadCount } from "./notification.queries";
import { AppNotification, NotificationCounts } from "./notification.types";

export function subscribeToNotifications(
  onNew: (notification: AppNotification) => void,
  onCountChange?: (counts: NotificationCounts) => void,
): () => void {
  let channel: RealtimeChannel | null = null;

  supabase.auth.getUser().then(({ data: { user } }) => {
    if (!user) return;

    channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          // El payload no trae JOINs — hacer 1 query para obtener la notificación completa
          const { data, error } = await supabase
            .from("notifications")
            .select(NOTIFICATION_SELECT)
            .eq("notification_id", payload.new.notification_id)
            .single();

          if (error || !data) return;

          onNew(data as unknown as AppNotification);

          if (onCountChange) {
            const { data: counts } = await getUnreadCount();
            if (counts) onCountChange(counts);
          }
        },
      )
      .subscribe();
  });

  return () => {
    if (channel) supabase.removeChannel(channel);
  };
}

export function subscribeToUnreadCount(
  onCountChange: (counts: NotificationCounts) => void,
): () => void {
  let channel: RealtimeChannel | null = null;

  supabase.auth.getUser().then(({ data: { user } }) => {
    if (!user) return;

    const refresh = async () => {
      const { data } = await getUnreadCount();
      if (data) onCountChange(data);
    };

    channel = supabase
      .channel(`notification-count-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        refresh,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        refresh,
      )
      .subscribe();

    refresh(); // cargar conteo inicial
  });

  return () => {
    if (channel) supabase.removeChannel(channel);
  };
}
