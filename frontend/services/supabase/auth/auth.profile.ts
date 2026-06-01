import { supabase } from "@/lib/supabase/client";
import { AuthResult, AuthUser } from "./auth.types";
import { parseAuthError } from "./auth.errors";
import * as ImagePicker from "expo-image-picker";
import { getAuthUser } from "../helpers/validation";
import { validateFullName, validateUsername } from "./auth.helpers";

export async function updateProfilePic(
  userId: string,
): Promise<AuthResult<string>> {
  try {
    if (!userId) throw new Error("El ID de usuario es requerido.");

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted")
      return {
        data: null,
        error: "Se necesita permiso para acceder a la galería.",
      };

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length)
      return { data: null, error: null };

    const image = result.assets[0];
    const response = await fetch(image.uri);
    if (!response.ok)
      throw new Error("No se pudo leer la imagen seleccionada.");

    const blob = await response.blob();
    const filePath = `${userId}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("profile-pictures")
      .upload(filePath, blob, {
        contentType: "image/jpeg",
        upsert: true,
        cacheControl: "3600",
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("profile-pictures")
      .getPublicUrl(filePath);

    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("users")
      .update({ profile_pic: publicUrl })
      .eq("user_id", userId);

    if (updateError) throw updateError;

    return { data: publicUrl, error: null };
  } catch (err) {
    return { data: null, error: parseAuthError(err) };
  }
}

export async function editUsername(
  newUsername: string,
): Promise<AuthResult<AuthUser>> {
  try {
    const cleanUsername = validateUsername(newUsername);
    const currentUserId = await getAuthUser();

    // Obtener username actual para evitar update innecesario
    const { data: current } = await supabase
      .from("users")
      .select("username")
      .eq("user_id", currentUserId)
      .single();

    if (current?.username === cleanUsername)
      return { data: null, error: "El username es igual al actual." };

    // Verificar disponibilidad
    const { data: taken } = await supabase
      .from("users")
      .select("user_id")
      .eq("username", cleanUsername)
      .maybeSingle();

    if (taken)
      return { data: null, error: "Ese nombre de usuario ya está en uso." };

    const { data, error } = await supabase
      .from("users")
      .update({ username: cleanUsername })
      .eq("user_id", currentUserId)
      .select(
        "user_id, full_name, username, email, profile_pic, created_at, updated_at",
      )
      .single();

    if (error) throw error;

    return { data: data as AuthUser, error: null };
  } catch (err) {
    return { data: null, error: parseAuthError(err) };
  }
}

export async function editFullName(
  newFullName: string,
): Promise<AuthResult<AuthUser>> {
  try {
    const cleanName = validateFullName(newFullName);
    const currentUserId = await getAuthUser();

    const { data, error } = await supabase
      .from("users")
      .update({ full_name: cleanName })
      .eq("user_id", currentUserId)
      .select(
        "user_id, full_name, username, email, profile_pic, created_at, updated_at",
      )
      .single();

    if (error) throw error;

    return { data: data as AuthUser, error: null };
  } catch (err) {
    return { data: null, error: parseAuthError(err) };
  }
}
