

export type MediaType = 'image' | 'video';

export interface UploadResult{
    publicUrl: string;
    filePath: string;
    mediaType: MediaType;
}

export interface StorageResul<T = null>{
    data: T | null;
    error: string | null;
}

export interface ImagePickerOptions{
    mediaTypes?: 'images' | 'videos' | 'all';
    allowEditing?: boolean;
    aspect?: [number, number]
    quality?: number;
    maxWidth?: number;
}

export interface UploadProfilePicOptions{
    quality?: number;
    size?: number;
}

export const BUCKETS = {
    PROFILE_PICTURES: 'profile-pictures',
    POST_IMAGES: 'post-images'
} as const

export type BucketName = typeof BUCKETS[keyof typeof BUCKETS]

export const limits = {
    image_max_bytes: 10 * 1024 * 1024,
    video_max_bytes: 100 * 1024 * 1024,
    avatar_size: 400,
    post_width: 1080,
    max_batch_files: 10
}

export const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
export const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime'])