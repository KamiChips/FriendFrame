import { supabase } from "@/lib/supabase/client";
import { getAuthUser } from "../helpers/validation";
import { mapRow, parseError } from "./feed.helpers";
import { DEFAULT_LIMIT, FeedResult, MAX_LIMIT } from "./feed.types";

//Devuelve el feed
//Posts + Fragments de las personas a las que sigue el usuario

export async function getFeed(
  page = 0,
  limit = DEFAULT_LIMIT,
): Promise<FeedResult> {
  try {
    const currentUserId = await getAuthUser();

    const safeLimit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(limit)));
    const safeOffset = Math.max(0, Math.floor(page)) * safeLimit;

    const { data, error } = (await supabase.rpc("get_home_feed", {
      p_user_id: currentUserId,
      p_limit: safeLimit + 1, // pedimos 1 extra para saber si hay más
      p_offset: safeOffset,
    })) as { data: any[] | null; error: any };

    if (error) throw error;

    const rows = data ?? [];
    const hasMore = rows.length > safeLimit;
    const items = hasMore ? rows.slice(0, safeLimit) : rows;

    return {
      data: items.map(mapRow),
      error: null,
      hasMore,
    };
  } catch (err) {
    return { data: [], error: parseError(err), hasMore: false };
  }
}
