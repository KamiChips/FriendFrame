import { supabase } from '@/lib/supabase/client';
import {
    ALLOWED_IMAGE_TYPES,
    ALLOWED_VIDEO_TYPES,
    BucketName,
    ImagePickerOptions,
    limits,
    MediaType,
} from './types.storage';
import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export function clampQuality(q?: number): number {
    return Math.min(1, Math.max(0.1, q ?? 0.85));
}

export function clampSize(s?: number): number {
    return Math.min(2000, Math.max(100, s ?? limits.avatar_size));
}

export function parseError(err: unknown): string {
    if (!err) return 'Unknown error';
    const msg = (err as Error).message ?? String(err);

    const known: [string, string][] = [
        ['Payload too large', 'The file is too large.'],
        ['413', 'The file is too large.'],
        ['Invalid mime type', 'File type not allowed.'],
        ['mime', 'File type not allowed.'],
        ['row-level security', 'You do not have permission to upload files.'],
        ['403', 'You do not have permission to upload files.'],
        [
            'Bucket not found',
            'Storage bucket is not configured.',
        ],
        ['NetworkError', 'Network error. Check your connection.'],
        ['network', 'Network error. Check your connection.'],
        ['Failed to fetch', 'Network error. Check your connection.'],
        ['The file does not exist', 'The file does not exist.'],
        ['too large', msg],
        ['not allowed', msg],
        ['does not exist', msg],
        ['Invalid', msg],
        ['Permission required', msg],
        ['Could not', msg],
    ];

    for (const [key, value] of known) {
        if (msg.includes(key)) return value;
    }

    return 'An unexpected error occurred while processing the file.';
}

export async function uriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
    const response = await fetch(uri);
    if (!response.ok) throw new Error('Could not read file.');
    return response.arrayBuffer();
}

export async function getFileSize(uri: string): Promise<number> {
    const info = await FileSystem.getInfoAsync(uri);

    if (!info.exists) throw new Error('The file does not exist.');
    return (info as FileSystem.FileInfo & { size: number }).size ?? 0;
}

export function getMimeType(uri: string, mediaType: MediaType): string {
    const lower = uri.toLowerCase();
    let mime: string;

    if (mediaType === 'video') {
        mime = lower.includes('.mov') ? 'video/quicktime' : 'video/mp4';
        if (!ALLOWED_VIDEO_TYPES.has(mime))
            throw new Error('Video type not allowed.');
        return mime;
    }

    if (lower.includes('.png')) mime = 'image/png';
    else if (lower.includes('.webp')) mime = 'image/webp';
    else if (lower.includes('.gif')) mime = 'image/gif';
    else mime = 'image/jpeg';

    if (!ALLOWED_IMAGE_TYPES.has(mime))
        throw new Error('Image type not allowed.');
    return mime;
}

export function extractPathFromUrl(
    publicUrl: string,
    bucket: BucketName
): string | null {
    try {
        const marker = `/object/public/${bucket}/`;
        const idx = publicUrl.indexOf(marker);
        if (idx === -1) return null;
        return decodeURIComponent(
            publicUrl.slice(idx + marker.length).split('?')[0]
        );
    } catch {
        return null;
    }
}

export async function resizeImage(
    uri: string,
    maxWidth: number,
    quality: number
): Promise<string> {
    const safeWidth = Math.min(4096, Math.max(100, maxWidth));
    const safeQuality = clampQuality(quality);

    const result = await manipulateAsync(
        uri,
        [{ resize: { width: safeWidth } }],
        { compress: safeQuality, format: SaveFormat.JPEG }
    );
    return result.uri;
}

export async function uploadToStorage(
    bucket: BucketName,
    filePath: string,
    buffer: ArrayBuffer,
    contentType: string,
    upsert: boolean,
    cacheControl: string
): Promise<string> {
    const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, buffer, { contentType, upsert, cacheControl });

    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
}

export function toPickerMediaType(
    opt: ImagePickerOptions['mediaTypes']
): ImagePicker.MediaType[] {
    if (opt === 'videos') return ['videos'];
    if (opt === 'all') return ['images', 'videos', 'livePhotos'];
    return ['images'];
}
