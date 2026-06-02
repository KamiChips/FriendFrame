import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import Feather from "@expo/vector-icons/Feather";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        tabBarInactiveTintColor: isDark ? "#6B7280" : "#9CA3AF",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: isDark ? "#1F2B4A" : "#ffffff",
          borderTopColor: isDark ? "#404b65" : "#e6e6e6",
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 8,
          paddingTop: 8,
          position: "absolute",
        },
        tabBarLabelStyle: {
          fontFamily: "Spartan",
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="Feed"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: "Buscar",
          tabBarIcon: ({ color }) => (
            <SimpleLineIcons name="magnifier" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ChatInboxScreen"
        options={{
          title: "Mensajes",
          tabBarIcon: ({ color }) => (
            <Feather name="message-circle" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
