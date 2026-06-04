import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SearchBar from "@/components/ui/SearchBar";
import UserSearchRow from "@/components/ui/user-search-row";
import FriendFrameHeader from "@/components/ui/FriendframeHeader";
import "../../../global.css";
import { supabase } from "@/lib/supabase/client";
import { useUserSearch } from "@/hooks/useUserSearch";
import { useRouter } from "expo-router";

export default function ExploreScreen() {
  const [userID, setUserID] = useState<string | undefined>(undefined);
  const isDark = useColorScheme() === "dark";
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserID(data.session?.user.id);
    });
  }, []);

  const { query, setQuery, results, loading, error } = useUserSearch({
    currentUserId: userID,
  });

  const showEmpty =
    !loading && !error && query.trim().length >= 2 && results.length === 0;
  const showHint = !loading && !error && query.trim().length < 2;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#1F2B4A]">
      <View className="">
        <FriendFrameHeader isDark={isDark} />
      </View>

      <View className="flex-1 bg-background-light dark:bg-[#182240]">
        <View className="px-6 pt-6 pb-4">
          <Text className="font-spartan-bold text-2xl text-black dark:text-white mb-6">
            Buscar Usuarios
          </Text>
          <SearchBar
            placeholder="Buscar por nombre o usuario..."
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
        </View>

        <ScrollView
          className="flex-1 px-6 pt-2"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Bug fix: era loading && error, nunca mostraba nada */}
          {!loading && error && (
            <View className="mt-10 items-center justify-center">
              <Text className="font-spartan text-red-400 text-center">
                {error}
              </Text>
            </View>
          )}

          {loading && (
            <View className="mt-10 items-center justify-center">
              <ActivityIndicator color={isDark ? "#ffffff" : "#182240"} />
            </View>
          )}

          {showEmpty && (
            <View className="mt-10 items-center justify-center">
              <Text className="font-spartan text-gray-400 text-center">
                No se encontraron usuarios con "{query}"
              </Text>
            </View>
          )}

          {showHint && (
            <View className="mt-10 items-center justify-center">
              <Text className="font-spartan text-gray-400 text-center">
                Ingresa al menos 2 caracteres para buscar usuarios.
              </Text>
            </View>
          )}

          {!loading &&
            !error &&
            results.map((u) => {
              // Bug fix: mapea los campos reales del RPC, no los del mock
              const displayName = u.full_name ?? u.username;
              const initials = displayName
                .split(" ")
                .map((w: string) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <UserSearchRow
                  key={u.user_id}
                  name={displayName}
                  username={`@${u.username}`}
                  initials={initials}
                  profilePic={u.profile_pic}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/explore/[userId]",
                      params: { userId: u.user_id },
                    })
                  }
                />
              );
            })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
