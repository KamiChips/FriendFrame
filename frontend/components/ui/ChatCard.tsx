import { LinearGradient } from "expo-linear-gradient";
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import "../../global.css";
import ProfileIcon from "./ProfileIcon";
import { router } from "expo-router";

type ChatCardProps = {
  id: string;
  initials: string;
  name: string;
  message: string;
  time: string;
  unread: boolean;
  unreadCount?: number;
  isDark: boolean;
  targetUserId?: string | null;
  onPress: () => void;
  profilePic?: string | null;
};

const ChatCard = ({
  id,
  initials,
  name,
  message,
  time,
  unread,
  unreadCount = 0,
  isDark,
  targetUserId,
  onPress,
  profilePic,
}: ChatCardProps) => {
  return (
    <TouchableOpacity
      className="flex-row items-center bg-background-light mx-4 mb-3 px-4 py-3 rounded-2xl dark:bg-background-semidark"
      activeOpacity={0.7}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
      }}
      onPress={onPress}
    >
      {/* Perfil de usuario */}
      <TouchableOpacity
        onPress={() => {
          if (!targetUserId) return;
          router.push({
            pathname: "/(tabs)/explore/[userId]",
            params: { userId: targetUserId },
          });
        }}
      >
        <View className="mr-3 relative">
          <ProfileIcon
            initials={initials}
            isDark={isDark}
            profilePic={profilePic}
          />

          {/* Puntito de no leido */}
          {unread && (
            <View className="absolute -top-1 -right-1 w-5 h-5 bg-primary-dark rounded-full border-2 border-background-light dark:bg-secondary-dark dark:border-background-semidark items-center justify-center">
              {unreadCount > 0 && unreadCount < 10 && (
                <Text className="text-white text-[9px] font-spartan-bold">
                  {unreadCount}
                </Text>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Info del Chat */}
      <View className="flex-1">
        <Text
          className={`font-spartan text-[#1a1a1a] mb-0.5 dark:text-background-light ${
            unread
              ? "font-spartan-bold text-[#1a1a1a] dark:text-background-light"
              : "text-[#1a1a1a] dark:text-background-light"
          }`}
        >
          {name}
        </Text>
        <Text
          className={`text-xs font-spartan ${
            unread
              ? "text-[#1a1a1a] dark:text-background-light"
              : "text-[#888] dark:text-gray-400"
          }`}
        >
          {message}
        </Text>
      </View>

      <Text className="text-xs text-[#aaa] ml-2">{time}</Text>
    </TouchableOpacity>
  );
};

export default ChatCard;
