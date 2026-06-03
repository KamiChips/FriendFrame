import { supabase } from "@/lib/supabase/client";
import { parseError, computeStats } from "./profile.helper";
import {
  ProfileResult,
  FullProfile,
  UserProfile,
  ProfileStats,
  SearchResult,
  MAX_SEARCH_LENGTH,
  MAX_SEARCH_RESULTS,
  MIN_SEARCH_LENGTH,
} from "./types";
import { assertUUID, getAuthUser } from "../helpers/validation";
import { RelationshipStatus } from "../social/social.types";

export async function getProfile(
  targetUserId: string,
  currentUserId: string,
): Promise<ProfileResult<FullProfile>> {
  try {
    assertUUID(targetUserId, "ID de perfil");
    assertUUID(currentUserId, "ID de usuario");

    // 3 llamadas en paralelo en lugar de 10 queries
    const [profileRes, statsResult, relationshipRes] = await Promise.all([
      supabase
        .from("users")
        .select("user_id, full_name, username, email, profile_pic, created_at")
        .eq("user_id", targetUserId)
        .single(),

      computeStats(targetUserId),

      supabase
        .rpc("get_relationship_status", {
          current_user_id: currentUserId,
          target_user_id: targetUserId,
        })
        .single<RelationshipStatus>(),
    ]);

    if (profileRes.error) throw profileRes.error;
    if (relationshipRes.error) throw relationshipRes.error;

    const rel = relationshipRes.data;

    return {
      data: {
        ...(profileRes.data as UserProfile),
        stats: statsResult,
        i_follow_them: Boolean(rel?.i_follow_them),
        is_following_me: Boolean(rel?.they_follow_me),
        is_friend: Boolean(rel?.is_friend),
        is_blocked: Boolean(rel?.is_blocked),
        blocked_me: Boolean(rel?.blocked_me),
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
}

export async function getProfileStats(
  userId: string,
): Promise<ProfileResult<ProfileStats>> {
  try {
    assertUUID(userId, "ID de usuario");
    const stats = await computeStats(userId);
    return { data: stats, error: null };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
}

export async function getMyProfile(): Promise<
  ProfileResult<UserProfile & { stats: ProfileStats }>
> {
  try {
    const currentUserId = await getAuthUser();

    const [profileRes, stats] = await Promise.all([
      supabase
        .from("users")
        .select("user_id, full_name, username, email, profile_pic, created_at")
        .eq("user_id", currentUserId)
        .single(),
      computeStats(currentUserId),
    ]);

    if (profileRes.error) throw profileRes.error;

    return {
      data: { ...(profileRes.data as UserProfile), stats },
      error: null,
    };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
}

export async function searchUsers(
  query: string,
  currentUserId: string,
  limit: number = 20,
): Promise<ProfileResult<SearchResult[]>> {
  try {
    assertUUID(currentUserId, "ID de usuario");

    const q = query.trim();

    if (q.length < MIN_SEARCH_LENGTH) {
      return { data: [], error: null };
    }

    if (q.length > MAX_SEARCH_LENGTH) {
      return {
        data: [],
        error: `La búsqueda no puede superar ${MAX_SEARCH_LENGTH} caracteres.`,
      };
    }

    // Sanitizar el query: eliminar caracteres especiales de SQL
    // La función SQL ya usa parámetros preparados pero filtramos igual
    const sanitized = q.replace(/[%_\\]/g, "\\$&");
    const safeLimit = Math.min(
      MAX_SEARCH_RESULTS,
      Math.max(1, Math.floor(limit)),
    );

    // 1 RPC hace búsqueda + exclusión de bloqueados + relación social
    const { data, error } = (await supabase.rpc("search_users", {
      search_query: sanitized,
      current_user_id: currentUserId,
      result_limit: safeLimit,
    })) as { data: SearchResult[] | null; error: any };

    if (error) throw error;

    return { data: data ?? [], error: null };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
}
