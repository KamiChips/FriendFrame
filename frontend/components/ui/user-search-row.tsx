import React from "react";
import { View, Text, TouchableOpacity, useColorScheme } from "react-native";
import ProfileIcon from "./ProfileIcon";

interface UserSearchRowProps {
  name: string;
  username: string;
  initials: string;
  onPress?: () => void;
  profilePic?: string | null;
}

export default function UserSearchRow({
  name,
  username,
  initials,
  onPress,
  profilePic,
}: UserSearchRowProps) {
  const isDark = useColorScheme() === "dark";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center border border-gray-300 dark:border-[#2A3654] bg-white dark:bg-[#1D2A4F] rounded-2xl p-4 mb-3"
    >
      <View className="flex-row">
        <ProfileIcon
          initials={initials}
          isDark={isDark}
          profilePic={profilePic}
        />
        <View className="flex-col justify-center ml-4">
          <Text className="font-spartan-bold text-base text-black dark:text-white mb-0.5">
            {name}
          </Text>
          <Text className="font-spartan text-sm text-gray-500 dark:text-gray-400">
            {username}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
