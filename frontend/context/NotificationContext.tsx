import { getUnreadCount } from "@/services/supabase/notifications/notification.queries";
import { subscribeToUnreadCount } from "@/services/supabase/notifications/notification.realtime";
import { NotificationCounts } from "@/services/supabase/notifications/notification.types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface NotificationsBadgeContextValue {
  counts: NotificationCounts;
  refreshCounts: () => Promise<void>;
}

const DEFAULT_COUNTS: NotificationCounts = {
  total: 0,
  follows: 0,
  posts: 0,
  messages: 0,
};

const NotificationsBadgeContext =
  createContext<NotificationsBadgeContextValue | null>(null);

export function NotificationsBadgeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [counts, setCounts] = useState<NotificationCounts>(DEFAULT_COUNTS);

  const refreshCounts = useCallback(async () => {
    const { data } = await getUnreadCount();
    if (data) setCounts(data);
  }, []);

  useEffect(() => {
    // Carga inicial
    refreshCounts();

    // Realtime — actualiza el badge cuando llega una nueva notificación
    const unsub = subscribeToUnreadCount((newCounts) => {
      setCounts(newCounts);
    });
    return unsub;
  }, [refreshCounts]);

  return (
    <NotificationsBadgeContext.Provider value={{ counts, refreshCounts }}>
      {children}
    </NotificationsBadgeContext.Provider>
  );
}

export function useNotificationsBadge(): NotificationsBadgeContextValue {
  const ctx = useContext(NotificationsBadgeContext);
  if (!ctx)
    throw new Error(
      "useNotificationsBadge debe usarse dentro de <NotificationsBadgeProvider>",
    );
  return ctx;
}
