import { supabase } from "@/lib/supabase/client";
import {
  PaginationParams,
  ProfileResult,
  SearchResult,
  UserProfile,
} from "./types";
import { parseError } from "../helpers/errors";
import { assertUUID } from "../helpers/validation";
import { normalizePagination } from "./profile.helper";

export async function getFollowers(
  userId: string,
  currentUserId: string,
  params: PaginationParams = {},
): Promise<ProfileResult<SearchResult[]>> {
  try {
    assertUUID(userId, "ID de perfil");
    assertUUID(currentUserId, "ID de usuario");

    const { limit, offset } = normalizePagination(params);

    const { data, error } = (await supabase.rpc(
      "get_followers_with_relationship",
      {
        target_user_id: userId,
        current_user_id: currentUserId,
        p_limit: limit,
        p_offset: offset,
      },
    )) as { data: SearchResult[] | null; error: any };

    if (error) throw error;

    return { data: data ?? [], error: null };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
}

export async function getFollowing(
  userId: string,
  currentUserId: string,
  params: PaginationParams = {},
): Promise<ProfileResult<SearchResult[]>> {
  try {
    assertUUID(userId, "ID de perfil");
    assertUUID(currentUserId, "ID de usuario");

    const { limit, offset } = normalizePagination(params);

    const { data, error } = (await supabase.rpc(
      "get_following_with_relationship",
      {
        target_user_id: userId,
        current_user_id: currentUserId,
        p_limit: limit,
        p_offset: offset,
      },
    )) as { data: SearchResult[] | null; error: any };

    if (error) throw error;

    return { data: data ?? [], error: null };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
}

export async function getFriends(
  userId: string,
): Promise<ProfileResult<UserProfile[]>> {
  try {
    assertUUID(userId, "ID de usuario");

    const { data, error } = await supabase.rpc("get_friends", {
      target_user_id: userId,
    });

    if (error) throw error;

    return { data: data as UserProfile[], error: null };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
}
