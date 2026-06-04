import { supabase } from "@/lib/supabase/client";
import { assertUUID, getAuthUser } from "../helpers/validation";
import {
  assertFriendship,
  attachCountsBatch,
  deleteMediaFile,
  notifyNewPublication,
  parseError,
  sanitizeDescription,
  uploadMediaFile,
} from "./helpers";
import { Post, PostResult, PostWithCounts } from "./types";
import * as ImagePicker from "expo-image-picker";

export async function createPost(
  profileOwnerId: string,
  description?: string,
): Promise<PostResult<Post>> {
  try {
    assertUUID(profileOwnerId, "ID de perfil");
    const sanitized = sanitizeDescription(description);
    const currentUserId = await getAuthUser();

    await assertFriendship(currentUserId, profileOwnerId);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted")
      throw new Error("Se necesita permiso para acceder a la galería.");

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos", "livePhotos"],
      allowsEditing: false,
      quality: 0.85,
    });

    if (result.canceled) return { data: null, error: null };

    const asset = result.assets[0];
    const mediaType = asset.type === "video" ? "video" : "image";
    const mediaUrl = await uploadMediaFile(currentUserId, asset.uri, mediaType);

    const { data, error } = await supabase
      .from("posts")
      .insert({
        author_id: currentUserId,
        account_owner_id: profileOwnerId,
        media: mediaUrl,
        media_type: mediaType,
        description: sanitized,
      })
      .select(
        `
        *,
        author:users!author_id (
          user_id, username, full_name, profile_pic
        )
      `,
      )
      .single();

    if (error) throw error;

    notifyNewPublication(
      profileOwnerId,
      currentUserId,
      "new_post",
      data.post_id,
    );

    return { data: data as Post, error: null };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
}

export async function editPost(
  postId: string,
  newDescription: string | null,
): Promise<PostResult<Post>> {
  try {
    assertUUID(postId, "postId");
    const sanitized = sanitizeDescription(newDescription);
    const currentUserId = await getAuthUser();

    const { data, error } = await supabase
      .from("posts")
      .update({ description: sanitized })
      .eq("post_id", postId)
      .eq("author_id", currentUserId)
      .select(
        `
        *,
        author:users!author_id (
          user_id, username, full_name, profile_pic
        )
      `,
      )
      .single();

    if (error) throw error;
    if (!data) throw new Error("Post no encontrado o sin permisos.");

    return { data: data as Post, error: null };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
}

export async function deletePost(postId: string): Promise<PostResult> {
  try {
    assertUUID(postId, "postId");
    const currentUserId = await getAuthUser();

    const { data: existing, error: fetchError } = await supabase
      .from("posts")
      .select("media")
      .eq("post_id", postId)
      .eq("author_id", currentUserId)
      .single();

    if (fetchError || !existing)
      throw new Error("Post no encontrado o sin permisos para eliminarlo.");

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("post_id", postId)
      .eq("author_id", currentUserId);

    if (error) throw error;

    deleteMediaFile(existing.media); // fire-and-forget

    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
}

export async function getPostWithCounts(
  postId: string,
  currentUserId: string,
): Promise<PostResult<PostWithCounts>> {
  try {
    assertUUID(postId, "postId");
    assertUUID(currentUserId, "ID de usuario");

    const { data, error } = await supabase
      .from("posts")
      .select(
        `
        *,
        author:users!author_id (
          user_id, username, full_name, profile_pic
        )
      `,
      )
      .eq("post_id", postId)
      .single();

    if (error) throw error;

    const { postsMap } = await attachCountsBatch(
      [data as Post],
      [],
      currentUserId,
    );
    const counts = postsMap.get(postId) ?? {
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      liked_by_me: false,
    };

    return { data: { ...(data as Post), ...counts }, error: null };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
}

export const getUserPosts = async (userId: string) => {
  return supabase
    .from("posts")
    .select(
      `
      post_id,
      media,
      description,
      account_owner_id,
      created_at,
      account_owner:users!account_owner_id (
        username,
        profile_pic
      )
    `,
    )
    .eq("author_id", userId)
    .order("created_at", { ascending: false });
};
