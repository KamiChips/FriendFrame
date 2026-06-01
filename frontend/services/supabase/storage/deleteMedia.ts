import { supabase } from "@/lib/supabase/client";
import { extractPathFromUrl, parseError } from "./storage.helpers";
import { BUCKETS, StorageResul } from "./types.storage";
import { assertUUID } from "../helpers/validation";


export async function deletePostImage(publicUrl: string): Promise<StorageResul> {
  try {
    if (!publicUrl) return { data: null, error: null }
 
    const filePath = extractPathFromUrl(publicUrl, BUCKETS.POST_IMAGES)
    if (!filePath) return { data: null, error: null }   // URL inválida o de otro bucket
 
    const { error } = await supabase.storage
      .from(BUCKETS.POST_IMAGES)
      .remove([filePath])
 
    if (error && !error.message.includes('404') && !error.message.includes('Not Found')) {
      throw error
    }
 
    return { data: null, error: null }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}

export async function deleteProfilePic(userId: string): Promise<StorageResul> {
  try {
    assertUUID(userId, 'ID de usuario')
 
    const filePath = `${userId}.jpg`
 
    const { error: storageError } = await supabase.storage
      .from(BUCKETS.PROFILE_PICTURES)
      .remove([filePath])
 
    if (
      storageError &&
      !storageError.message.includes('404') &&
      !storageError.message.includes('Not Found')
    ) {
      throw storageError
    }
 
    const { error: dbError } = await supabase
      .from('users')
      .update({ profile_pic: null })
      .eq('user_id', userId)
 
    if (dbError) throw dbError
 
    return { data: null, error: null }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}