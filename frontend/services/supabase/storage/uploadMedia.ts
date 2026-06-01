import { resetToDefaults } from "expo-router/testing-library";
import { assertUUID } from "../helpers/validation";
import { clampQuality, clampSize, getFileSize, getMimeType, parseError, resizeImage, uploadToStorage, uriToArrayBuffer } from "./storage.helpers";
import { BucketName, BUCKETS, ImagePickerOptions, limits, StorageResul, UploadProfilePicOptions, UploadResult } from "./types.storage";
import * as ImagePicker from 'expo-image-picker'
import { supabase } from "@/lib/supabase/client";


export async function uploadProfilePic(
    userId: string,
    options: UploadProfilePicOptions = {}
): Promise<StorageResul<UploadResult>>{
    try{
        assertUUID(userId, 'ID de usuario')

        const quality = clampQuality(options.quality ?? 0.8)
        const size = clampSize(options.size ?? limits.avatar_size)

        const{ status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if(status !== 'granted')
            return{ data: null, error: 'Se necesita permiso para acceder a la galería.'}

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1,1],
            quality: 1
        })

        if(result.canceled) return {data: null, error: null}
        if(result.assets?.length) return { data: null, error: 'No se seleccióno ningún archivo'}

        const asset = result.assets[0]
        const resizedUri = await resizeImage(asset.uri, size, quality)

        const fileSize = await getFileSize(resizedUri)

        if(fileSize > limits.image_max_bytes){
            return{ data: null, error: `La imagen es demasiado grande (máximo ${limits.image_max_bytes / 1024 / 1024} MB)`}
        }

        const buffer = await uriToArrayBuffer(resizedUri)
        const filePath = `${userId}.jpg`

        const publicUrl = await uploadToStorage(
            BUCKETS.PROFILE_PICTURES,
            filePath,
            buffer,
            'image/jpeg',
            true,
            '3600'
        )

        const urlWithBuster = `${publicUrl}?t=${Date.now()}`

        const{ error: updateError} = await supabase
        .from('users')
        .update({profile_pic: urlWithBuster})
        .eq('user_id', userId)

        if(updateError) throw updateError

        return{ data: {publicUrl: urlWithBuster, filePath, mediaType: 'image'}, error: null}
    }catch(err){
        return{data: null, error: parseError(err)}
    }

}

export async function uploadPostImage(
    authorId: string,
    asset: ImagePicker.ImagePickerAsset,
    options: Pick<ImagePickerOptions, 'quality' | 'maxWidth'> = {}
): Promise<StorageResul<UploadResult>>{
    try{
        assertUUID(authorId, 'ID de autor')

        const isVideo = asset.type === 'video'
        const mediaType = isVideo ? 'video' : 'image'
        const maxBytes = isVideo ? limits.video_max_bytes : limits.image_max_bytes

        getMimeType(asset.uri, mediaType)

        const originalSize = await getFileSize(asset.uri)
        if(originalSize > maxBytes){
            const mb = maxBytes / 1024 / 1024;
            return{data: null, error: `El archivo es demasiado grande (máximo ${mb} MB).`}
        }

        let finalUri = asset.uri;
        if(!isVideo){
            const maxWidth = Math.min(2160, Math.max(320, options.maxWidth ?? limits.post_width))

            finalUri = await resizeImage(asset.uri, maxWidth, clampQuality(options.quality))

            const resizedSize = await getFileSize(finalUri)

            if(resizedSize > limits.image_max_bytes){
                return{data: null, error: 'La imagen procesada es demasiado grande.'}
            }
        }

        const buffer = await uriToArrayBuffer(finalUri)
        const mimeType = getMimeType(finalUri, mediaType)
        const ext = isVideo ? 'mp4' : 'jpg'
        const filePath = `${authorId}/${Date.now()}.${ext}`

        const publicUrl = await uploadToStorage(
            BUCKETS.POST_IMAGES,
            filePath,
            buffer,
            mimeType,
            false,
            '31536000'
        )

        return { data: {publicUrl, filePath, mediaType}, error: null}
        
    } catch(err){
        return{ data: null, error: parseError(err)}
    }
}

export async function uploadMultiple(
  authorId: string,
  assets: ImagePicker.ImagePickerAsset[]
): Promise<StorageResul<{ successful: UploadResult[]; failed: string[] }>> {
  try {
    assertUUID(authorId, 'ID de autor')
 
    if (assets.length === 0)
      return { data: { successful: [], failed: [] }, error: null }
 
    if (assets.length > limits.max_batch_files) {
      return {
        data:  null,
        error: `Máximo ${limits.max_batch_files} archivos por lote.`,
      }
    }
 
    const results = await Promise.allSettled(
      assets.map(asset => uploadPostImage(authorId, asset))
    )
 
    const successful: UploadResult[] = []
    const failed: string[] = []
 
    results.forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value.data) {
        successful.push(result.value.data)
      } else {
        const reason =
          result.status === 'rejected'
            ? parseError(result.reason)
            : (result.value.error ?? 'Error desconocido')
        failed.push(`Archivo ${i + 1}: ${reason}`)
      }
    })
 
    return { data: { successful, failed }, error: null }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}
export function getPublicUrl(bucket: BucketName, filePath: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
  return data.publicUrl
}