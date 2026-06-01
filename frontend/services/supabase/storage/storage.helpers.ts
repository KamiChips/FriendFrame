import { supabase } from "@/lib/supabase/client";
import { ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, BucketName, ImagePickerOptions, limits, MediaType } from "./types.storage";
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'
import * as ImagePicker from 'expo-image-picker'


export function clampQuality(q?: number): number {
  return Math.min(1, Math.max(0.1, q ?? 0.85))
}
 
export function clampSize(s?: number): number {
  return Math.min(2000, Math.max(100, s ?? limits.avatar_size))
}

export function parseError(err: unknown): string {
  if (!err) return 'Error desconocido'
  const msg = (err as Error).message ?? String(err)
 
  const known: [string, string][] = [
    ['Payload too large', 'El archivo es demasiado grande.'],
    ['413', 'El archivo es demasiado grande.'],
    ['Invalid mime type', 'Tipo de archivo no permitido.'],
    ['mime', 'Tipo de archivo no permitido.'],
    ['row-level security', 'No tienes permiso para subir archivos.'],
    ['403', 'No tienes permiso para subir archivos.'],
    ['Bucket not found', 'El bucket de almacenamiento no está configurado.'],
    ['NetworkError', 'Error de red. Verifica tu conexión.'],
    ['network', 'Error de red. Verifica tu conexión.'],
    ['Failed to fetch', 'Error de red. Verifica tu conexión.'],
    ['El archivo no existe', 'El archivo no existe.'],
    ['demasiado grande', msg],
    ['no permitido', msg],
    ['no existe', msg],
    ['inválido', msg],
    ['Se necesita permiso', msg],
    ['No se pudo', msg],
  ]
 
  for (const [key, value] of known) {
    if (msg.includes(key)) return value
  }
 
  return 'Ocurrió un error inesperado al procesar el archivo.'
}

export async function uriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const response = await fetch(uri)
  if (!response.ok) throw new Error('No se pudo leer el archivo.')
  return response.arrayBuffer()
}

export async function getFileSize(uri: string): Promise<number> {

  const info = await FileSystem.getInfoAsync(uri)

  if (!info.exists) throw new Error('El archivo no existe.')
  return (info as FileSystem.FileInfo & { size: number }).size ?? 0
}

export function getMimeType(uri: string, mediaType: MediaType): string {
  const lower = uri.toLowerCase()
  let mime: string
 
  if (mediaType === 'video') {
    mime = lower.includes('.mov') ? 'video/quicktime' : 'video/mp4'
    if (!ALLOWED_VIDEO_TYPES.has(mime)) throw new Error('Tipo de video no permitido.')
    return mime
  }
 
  if (lower.includes('.png'))  mime = 'image/png'
  else if (lower.includes('.webp')) mime = 'image/webp'
  else if (lower.includes('.gif'))  mime = 'image/gif'
  else mime = 'image/jpeg'
 
  if (!ALLOWED_IMAGE_TYPES.has(mime)) throw new Error('Tipo de imagen no permitido.')
  return mime
}

export function extractPathFromUrl(publicUrl: string, bucket: BucketName): string | null {
  try {
    const marker = `/object/public/${bucket}/`
    const idx    = publicUrl.indexOf(marker)
    if (idx === -1) return null
    return decodeURIComponent(publicUrl.slice(idx + marker.length).split('?')[0])
  } catch {
    return null
  }
}

export async function resizeImage(
  uri:      string,
  maxWidth: number,
  quality:  number
): Promise<string> {
  const safeWidth   = Math.min(4096, Math.max(100, maxWidth))
  const safeQuality = clampQuality(quality)
 
  const result = await manipulateAsync(
    uri,
    [{ resize: { width: safeWidth } }],
    { compress: safeQuality, format: SaveFormat.JPEG }
  )
  return result.uri
}

export async function uploadToStorage(
  bucket:      BucketName,
  filePath:    string,
  buffer:      ArrayBuffer,
  contentType: string,
  upsert:      boolean,
  cacheControl: string
): Promise<string> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, buffer, { contentType, upsert, cacheControl })
 
  if (error) throw error
 
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
  return data.publicUrl
}

export function toPickerMediaType(
  opt: ImagePickerOptions['mediaTypes']
): ImagePicker.MediaTypeOptions {
  if (opt === 'videos') return ImagePicker.MediaTypeOptions.Videos
  if (opt === 'all')    return ImagePicker.MediaTypeOptions.All
  return ImagePicker.MediaTypeOptions.Images
}