import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { signOut } from "@/services/supabase/auth/auth.sign-in";
import { getUserFragments } from "@/services/supabase/posts/fragment";
import { attachCountsBatch } from "@/services/supabase/posts/helpers";
import { getUserPosts } from "@/services/supabase/posts/posts";
import {
  getBlockedUsers,
  unblockUser,
} from "@/services/supabase/social/social.blocks";
import { BlockedUser, MyFragment, MyPost } from "@/types/settings.types";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

export const useSettings = (userId?: string) => {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [myPosts, setMyPosts] = useState<MyPost[]>([]);
  const [myFragments, setMyFragments] = useState<MyFragment[]>([]);

  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingFragments, setLoadingFragments] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const loadBlockedUsers = useCallback(async () => {
    setLoadingBlocked(true);

    const { data } = await getBlockedUsers();

    if (data) {
      setBlockedUsers(data);
    }

    setLoadingBlocked(false);
  }, []);

  const loadMyPosts = useCallback(async () => {
    if (!user) return;
    setLoadingPosts(true);

    const { data, error } = await supabase
      .from("posts")
      .select(
        `
      post_id, media, description, account_owner_id, created_at,
      account_owner:users!account_owner_id (
        user_id, username, full_name, profile_pic
      )
    `,
      )
      .eq("author_id", user.user_id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Obtener conteos reales
      const { postsMap } = await attachCountsBatch(
        data as any[],
        [],
        user.user_id,
      );

      const postsWithCounts = data.map((post: any) => ({
        ...post,
        ...(postsMap.get(post.post_id) ?? {
          likes_count: 0,
          comments_count: 0,
          shares_count: 0,
          liked_by_me: false,
        }),
      }));

      setMyPosts(postsWithCounts);
    }

    setLoadingPosts(false);
  }, [user]);

  const loadMyFragments = useCallback(async () => {
    if (!user) return;
    setLoadingFragments(true);

    const { data, error } = await supabase
      .from("fragments")
      .select(
        `
      fragment_id, content, account_owner_id, created_at,
      account_owner:users!account_owner_id (
        user_id, username, full_name, profile_pic
      )
    `,
      )
      .eq("author_id", user.user_id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const { fragmentsMap } = await attachCountsBatch(
        [],
        data as any[],
        user.user_id,
      );

      const fragmentsWithCounts = data.map((fragment: any) => ({
        ...fragment,
        ...(fragmentsMap.get(fragment.fragment_id) ?? {
          likes_count: 0,
          comments_count: 0,
          shares_count: 0,
          liked_by_me: false,
        }),
      }));

      setMyFragments(fragmentsWithCounts);
    }

    setLoadingFragments(false);
  }, [user]);

  const handleUnblock = async (userId: string) => {
    const { error } = await unblockUser(userId);

    if (!error) {
      setBlockedUsers((prev) => prev.filter((user) => user.user_id !== userId));
    }

    return error;
  };

  const handleLogOut = async () => {
    setLoading(true);
    const { error } = await signOut();
    setLoading(false);

    if (error) Alert.alert("Error", error);
  };

  return {
    blockedUsers,
    myPosts,
    myFragments,
    loadingBlocked,
    loadingPosts,
    loadingFragments,
    loadBlockedUsers,
    loadMyPosts,
    loadMyFragments,
    handleUnblock,
    handleLogOut,
  };
};
