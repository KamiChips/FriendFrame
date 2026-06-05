import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../global.css";
import GoBackButton from "../components/ui/GoBackButton";
import NotificationCard, {
  NotificationCardProps,
  NotificationType,
} from "../components/ui/NotificationCard";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  getNotifications,
  markAllAsRead,
  markAsRead,
} from "@/services/supabase/notifications/notification.queries";
import { type AppNotification } from "@/services/supabase/notifications/notification.types";
import { subscribeToNotifications } from "@/services/supabase/notifications/notification.realtime";
import { useAuth } from "@/context/AuthContext";

function mapNotificationType(type: AppNotification["type"]): NotificationType {
  switch (type) {
    case "new_follow":
      return NotificationType.FOLLOW;
    case "new_post":
      return NotificationType.POST;
    case "new_fragment":
      return NotificationType.POST;
    case "new_message":
      return NotificationType.MENTION;
    default:
      return NotificationType.MENTION;
  }
}

function formatTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora mismo";
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs} h`;
  return `Hace ${Math.floor(hrs / 24)} d`;
}

const NotificationInbox = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const { user } = useAuth();

  const loadNotifications = useCallback(async () => {
    const { data } = await getNotifications({ limit: 50 });

    if (data) setNotifications(data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications]),
  );

  useEffect(() => {
    const unsub = subscribeToNotifications((newNotif) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.notification_id === newNotif.notification_id))
          return prev;
        return [newNotif, ...prev];
      });
    });
    return unsub;
  }, []);

  const handlePress = async (notif: AppNotification) => {
    if (!notif.is_read) {
      await markAsRead(notif.notification_id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === notif.notification_id
            ? { ...n, is_read: true }
            : n,
        ),
      );
    }

    switch (notif.type) {
      case "new_follow":
        router.push({
          pathname: "/(tabs)/profile",
          params: { userId: notif.actor.user_id },
        });
        break;
      case "new_post":
      case "new_fragment":
        router.push({
          pathname: "/(tabs)/profile",
          params: { userId: user?.user_id },
        });
        break;
      case "new_message":
        if (notif.message?.chat_id) {
          router.push({
            pathname: "/ChatScreen",
            params: {
              chatId: notif.message.chat_id,
              chatName: notif.actor.full_name,
              chatInitials: notif.actor.full_name.charAt(0).toUpperCase(),
              isGroup: "false",
              targetUserId: notif.actor.user_id,
            },
          });
        }
        break;
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    const { data } = await markAllAsRead();
    if (data) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
    setMarkingAll(false);
  };

  const hasUnread = notifications.some((n) => !n.is_read);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <SafeAreaView
      className={`flex-1 bg-background-light ${isDark ? "dark" : ""} dark:bg-background-dark `}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#1a1a1a" : "#ffffff"}
      />

      {/* Header */}
      <View className="flex-row items-center justify-between pl-1 pr-4 pb-1 dark:bg-background-dark border-b border-[#e6e6e6] dark:border-[#404b65]">
        <View className="flex-row items-center">
          <GoBackButton isDark={isDark} onPress={() => router.back()} />
          <Text className="font-spartan-bold dark:text-background-light text-3xl self-center">
            Notificaciones
          </Text>
        </View>

        {/* Botón marcar todas como leídas */}
        {hasUnread && (
          <TouchableOpacity
            onPress={handleMarkAllAsRead}
            disabled={markingAll}
            className="py-1 px-3 rounded-full bg-gray-100 dark:bg-[#2A3654]"
          >
            {markingAll ? (
              <ActivityIndicator size="small" color="#30C2D9" />
            ) : (
              <Text className="text-xs font-spartan text-[#30C2D9]">
                Marcar todo
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View className="flex-1 bg-gray-50 dark:bg-background-dark">
        {loading ? (
          <ActivityIndicator color="#30C2D9" className="mt-10" />
        ) : notifications.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-gray-400 dark:text-gray-500 text-center font-spartan">
              No tienes notificaciones todavía
            </Text>
          </View>
        ) : (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {notifications.map((notif) => (
              <NotificationCard
                key={notif.notification_id}
                id={notif.notification_id}
                name={notif.actor.full_name}
                initials={notif.actor.full_name
                  .split(" ")
                  .map((w) => w[0].toUpperCase())
                  .slice(0, 2)
                  .join("")}
                profilePic={notif.actor.profile_pic}
                time={formatTime(notif.created_at)}
                unread={!notif.is_read}
                notificationType={mapNotificationType(notif.type)}
                isDark={isDark}
                comment={
                  notif.type === "new_message"
                    ? notif.message?.content
                    : undefined
                }
                onPress={() => handlePress(notif)}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

export default NotificationInbox;
