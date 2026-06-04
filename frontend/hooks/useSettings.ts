import { signOut } from "@/services/supabase/auth/auth.sign-in";
import { getUserFragments } from "@/services/supabase/posts/fragment";
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

  const loadBlockedUsers = useCallback(async () => {
    setLoadingBlocked(true);

    const { data } = await getBlockedUsers();

    if (data) {
      setBlockedUsers(data);
    }

    setLoadingBlocked(false);
  }, []);

  const loadMyPosts = useCallback(async () => {
    if (!userId) return;

    setLoadingPosts(true);

    const { data } = await getUserPosts(userId);

    if (data) {
      setMyPosts(data as unknown as MyPost[]);
    }

    setLoadingPosts(false);
  }, [userId]);

  const loadMyFragments = useCallback(async () => {
    if (!userId) return;

    setLoadingFragments(true);

    const { data } = await getUserFragments(userId);

    if (data) {
      setMyFragments(data as unknown as MyFragment[]);
    }

    setLoadingFragments(false);
  }, [userId]);

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
