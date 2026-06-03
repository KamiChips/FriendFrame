import React, { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import UserProfileHeader from "@/components/ui/UserProfileHeader";
import "../../global.css";
import { FloatingMenu } from "@/components/ui/FloatingMenu";
import BlockUserWarning from "@/components/ui/BlockUserWarning";
import ProfileTabs from "@/components/ui/ProfileTabs";
import FeedCard from "@/components/ui/FeedCard";
import { useAuth } from "@/context/AuthContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FullProfile } from "@/services/supabase/profile/types";
import { FeedItem } from "@/services/supabase/posts/types";
import { getProfile } from "@/services/supabase/profile/queries";
import { getProfileFeed } from "@/services/supabase/posts/feed";
import { toggleFollow } from "@/services/supabase/social/social.follows";
import {
  blockUser,
  unblockUser,
} from "@/services/supabase/social/social.blocks";
import { EditProfileModal } from "@/components/ui/EditProfileModal";

type TabType = "grid" | "list";

export default function ProfileScreen() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const { userId: paramUserId } = useLocalSearchParams<{ userId?: string }>();
  const targetUserId = paramUserId ?? currentUser?.user_id ?? "";
  const isOwnProfile = targetUserId === currentUser?.user_id;

  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("grid");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [editModalVisable, setEditModalVisible] = useState(false);

  const handleProfileSaved = async (
    newName: string,
    newUsername: string,
    newPic?: string,
  ) => {
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            full_name: newName,
            username: newUsername,
            profile_pic: newPic ?? prev.profile_pic,
          }
        : prev,
    );

    if (newPic) {
      await loadProfile();
    }
  };

  const loadProfile = useCallback(async () => {
    if (!targetUserId || !currentUser) return;
    setLoadingProfile(true);

    console.time("getProfile");
    const { data, error } = await getProfile(targetUserId, currentUser.user_id);
    console.timeEnd("getProfile");

    if (error) {
      Alert.alert("Error", error);
      setLoadingProfile(false);
      return;
    }

    setProfile(data);
    setLoadingProfile(false);
  }, [targetUserId, currentUser]);

  const loadFeed = useCallback(async () => {
    if (!targetUserId || !currentUser) return;
    setLoadingFeed(true);

    const { data } = await getProfileFeed(targetUserId, currentUser.user_id);
    if (data) setFeed(data);

    setLoadingFeed(false);
  }, [targetUserId, currentUser]);

  useEffect(() => {
    loadProfile();
    loadFeed();
  }, [loadProfile, loadFeed]);

  const handleToggleFollow = async () => {
    if (!profile || actionLoading) return;
    setActionLoading(true);

    const { data, error } = await toggleFollow(profile.user_id);

    if (error) {
      Alert.alert("Error", error);
    } else if (data) {
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              i_follow_them: data.following,
              is_friend: data.is_friend,
              stats: {
                ...prev.stats,
                followers_count: data.following
                  ? prev.stats.followers_count + 1
                  : prev.stats.followers_count - 1,
                friends_count: data.is_friend
                  ? prev.stats.friends_count + 1
                  : data.following
                    ? prev.stats.friends_count
                    : prev.stats.friends_count - 1,
              },
            }
          : prev,
      );
    }
    setActionLoading(false);
  };

  const handleBlock = async () => {
    if (!profile || actionLoading) return;

    setActionLoading(true);

    const { error } = await blockUser(profile.user_id);
    setActionLoading(false);

    if (error) {
      Alert.alert("Error", error);
    } else {
      router.back();
    }
  };

  const handleUnblock = async () => {
    if (!profile || actionLoading) return;
    setActionLoading(true);

    const { error } = await unblockUser(profile.user_id);
    setActionLoading(false);

    if (error) {
      Alert.alert("Error", error);
    } else {
      await loadProfile();
    }
  };

  if (loadingProfile || !profile) {
    return (
      <SafeAreaView className="flex-1 bg-background-light dark:bg-[#182240] items-center justify-center">
        <ActivityIndicator size="large" color="#30C2D9" />
      </SafeAreaView>
    );
  }

  if (profile.blocked_me) {
    return (
      <SafeAreaView className="flex-1 bg-background-light dark:bg-[#182240] items-center justify-center px-8">
        <Text className="text-xl font-spartan-bold text-gray-900 dark:text-white text-center">
          No puedes ver este perfil.
        </Text>
      </SafeAreaView>
    );
  }

  const gridPosts = feed.filter((item) => item.type === "post");

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-semidark">
      <ScrollView
        className="flex-1 bg-gray-50 dark:bg-background-dark"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <UserProfileHeader
          name={profile.full_name}
          username={profile.username}
          profileImageSource={
            profile.profile_pic ?? require("../../assets/images/Rick.jpg")
          }
          postsCount={profile.stats.publications_count}
          friendsCount={profile.stats.friends_count}
          followersCount={profile.stats.followers_count}
        />

        <View className="px-6 pb-4 bg-background-light dark:bg-[#182240]">
          {isOwnProfile ? (
            // ESCENARIO 1: Mi perfil/usuario
            <TouchableOpacity
              className="w-full py-3.5 rounded-2xl bg-gray-200 dark:bg-[#2A3654] items-center"
              onPress={() => setEditModalVisible(true)}
            >
              <Text className="font-spartan-bold text-black dark:text-white text-base">
                Editar Perfil
              </Text>
            </TouchableOpacity>
          ) : profile.is_blocked ? (
            // Yo bloquee a este usuario
            <TouchableOpacity
              className="w-full py-3.5 rounded-2xl bg-[#30C2D9] dark:bg-[#AA3E14] items-center"
              onPress={handleUnblock}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="ef4444" />
              ) : (
                <Text className="font-spartan-bold text-red-600 dark:text-red-300 text-base">
                  Desbloquear
                </Text>
              )}
            </TouchableOpacity>
          ) : !profile.i_follow_them ? (
            // No lo sigo: Seguir
            <TouchableOpacity
              className="w-full py-3.5 rounded-2xl bg-[#30C2D9] dark:bg-[#AA3E14] items-center"
              onPress={handleToggleFollow}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="font-spartan-bold text-white text-base">
                  Seguir
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            // Lo sigo: Siguiendo + Mensaje
            <View>
              <View className="flex-row justify-between gap-3">
                <TouchableOpacity
                  className="flex-1 py-3.5 rounded-2xl bg-gray-200 dark:bg-[#2A3654] items-center"
                  onPress={handleToggleFollow}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#6b7280" />
                  ) : (
                    <Text className="font-spartan-bold text-black dark:text-white text-base">
                      {profile.is_friend ? "👥 Amigos" : "Siguiendo"}
                    </Text>
                  )}
                </TouchableOpacity>

                {profile.is_friend && (
                  <TouchableOpacity
                    className="flex-1 py-3.5 rounded-2xl bg-gray-200 dark:bg-[#2A3654] items-center"
                    onPress={() => {
                      router.push({
                        pathname: "/(tabs)/ChatInboxScreen",
                        params: { targetUserId: profile.user_id },
                      });
                    }}
                  >
                    <Text className="font-spartan-bold text-black dark:text-white text-base">
                      Mensaje
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Bloquear */}
              <View className="mt-3">
                <BlockUserWarning
                  name={profile.username}
                  onBlock={handleBlock}
                />
              </View>
            </View>
          )}
        </View>

        {/* TABS */}
        <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* POSTS */}
        <View className="flex-1 bg-background-light dark:bg-[#182240] pt-4 min-h-[500px] items-center">
          {loadingFeed ? (
            <ActivityIndicator size="small" color="#30C2D9" className="mt-8" />
          ) : feed.length === 0 ? (
            <View className="mt-12 items-center px-8">
              <Text className="text-gray-400 text-center font-spartan">
                {isOwnProfile
                  ? "Nadie ha publicado en tu perfil todavía"
                  : "No hay publicaciones aún"}
              </Text>
            </View>
          ) : (
            <View>
              {activeTab === "grid" && (
                <View className="flex-row flex-wrap gap-2">
                  {gridPosts.length === 0 ? (
                    <View className="w-full mt-8 items-center px-8">
                      <Text className="text-gray-400 text-center font-spartan">
                        No hay fotos en este perfil
                      </Text>
                    </View>
                  ) : (
                    gridPosts.map((post) => (
                      <TouchableOpacity
                        key={post.post_id}
                        className="w-[32%] aspect-square bg-gray-200 dark:bg-[#2A3654]"
                        onPress={() => console.log("Post:", post.post_id)}
                      >
                        <Image
                          source={{ uri: post.image }}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="cover"
                        />
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}

              {activeTab === "list" && (
                <View className="gap-y-4">
                  {feed.map((item) => (
                    <FeedCard
                      key={
                        item.type === "post" ? item.post_id : item.fragment_id
                      }
                      authorName={item.author.full_name}
                      authorInitials={item.author.full_name
                        .charAt(0)
                        .toUpperCase()}
                      timeAgo={new Date(item.created_at).toLocaleDateString(
                        "es-MX",
                        {
                          day: "numeric",
                          month: "short",
                        },
                      )}
                      targetProfileName={profile.full_name}
                      textContent={
                        item.type === "post"
                          ? (item.description ?? "")
                          : item.content
                      }
                      imageSource={
                        item.type === "post" && item.image
                          ? { uri: item.image }
                          : undefined
                      }
                      likesCount={item.likes_count}
                      commentsCount={item.comments_count}
                      isLiked={item.liked_by_me}
                      comments={[]}
                    />
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* FloatingMenu */}
        {/*!isOwnProfile && (
          <View className="mb-40 pb-10 z-10">
            <FloatingMenu
              onCreatePost={() => console.log("Crear Post")}
              onCreateFragment={() => console.log("Crear Fragment")}
            />
          </View>
        )*/}
        {!isOwnProfile && profile.is_friend && (
          <View className="mb-40 pb-10 z-10">
            <FloatingMenu
              onCreatePost={() => console.log("Crear Post en", profile.user_id)}
              onCreateFragment={() =>
                console.log("Crear Fragment en", profile.user_id)
              }
            />
          </View>
        )}
      </ScrollView>

      <EditProfileModal
        visible={editModalVisable}
        onClose={() => setEditModalVisible(false)}
        currentName={profile.full_name}
        currentUsername={profile.username}
        onSaved={handleProfileSaved}
      />
    </SafeAreaView>
  );
}
