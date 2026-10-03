import {
    uploadProfilePic,
    uploadPostImage,
    uploadMultiple,
    getPublicUrl,
} from '@/services/supabase/storage/uploadMedia';
import { mockFrom, mockStorageFrom } from '@/__mocks__/supabaseMock';
import * as ImagePicker from 'expo-image-picker';
import * as StorageHelpers from '@/services/supabase/storage/storage.helpers';

jest.mock('@/lib/supabase/client', () => ({
    supabase: require('@/__mocks__/supabaseMock').supabase,
}));

jest.mock('expo-image-picker', () => ({
    requestMediaLibraryPermissionsAsync: jest.fn(),
    launchImageLibraryAsync: jest.fn(),
}));

jest.mock('@/services/supabase/storage/storage.helpers', () => ({
    clampQuality: jest.requireActual(
        '@/services/supabase/storage/storage.helpers'
    ).clampQuality,
    clampSize: jest.requireActual('@/services/supabase/storage/storage.helpers')
        .clampSize,
    getMimeType: jest.fn().mockReturnValue('image/jpeg'),
    getFileSize: jest.fn(),
    resizeImage: jest.fn(),
    uriToArrayBuffer: jest.fn(),
    uploadToStorage: jest.fn(),
    parseError: jest.requireActual(
        '@/services/supabase/storage/storage.helpers'
    ).parseError,
}));

const mockRequestPermissions =
    ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock;
const mockLaunchLibrary = ImagePicker.launchImageLibraryAsync as jest.Mock;
const mockGetFileSize = StorageHelpers.getFileSize as jest.Mock;
const mockResizeImage = StorageHelpers.resizeImage as jest.Mock;
const mockUriToArrayBuffer = StorageHelpers.uriToArrayBuffer as jest.Mock;
const mockUploadToStorage = StorageHelpers.uploadToStorage as jest.Mock;
const mockGetMimeType = StorageHelpers.getMimeType as jest.Mock;

const userId = '550e8400-e29b-41d4-a716-446655440000';
const mockAsset: ImagePicker.ImagePickerAsset = {
    uri: 'file://photo.jpg',
    width: 100,
    height: 100,
    type: 'image',
    fileName: 'photo.jpg',
    fileSize: 1024,
    assetId: null,
    base64: null,
    duration: null,
    exif: null,
    mimeType: 'image/jpeg',
    pairedVideoAsset: null,
};

beforeEach(() => {
    jest.clearAllMocks();
    mockGetFileSize.mockResolvedValue(1024);
    mockResizeImage.mockResolvedValue('file://resized.jpg');
    mockUriToArrayBuffer.mockResolvedValue(new ArrayBuffer(8));
    mockUploadToStorage.mockResolvedValue('https://cdn.example.com/file.jpg');
    mockGetMimeType.mockReturnValue('image/jpeg');
    mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
        }),
    });
    mockStorageFrom.mockReturnValue({
        getPublicUrl: jest.fn().mockReturnValue({
            data: { publicUrl: 'https://cdn.example.com/file.jpg' },
        }),
    });
});

// uploadProfilePic
describe('uploadProfilePic', () => {
    it('returns error if userId is invalid', async () => {
        const result = await uploadProfilePic('no-es-uuid');
        expect(result.error).toContain('user ID');
    });

    it('returns error if gallery permission denied', async () => {
        mockRequestPermissions.mockResolvedValue({ status: 'denied' });
        const result = await uploadProfilePic(userId);
        expect(result.error).toBe(
            'Permission required to access gallery.'
        );
    });

    it('returns null if user cancels', async () => {
        mockRequestPermissions.mockResolvedValue({ status: 'granted' });
        mockLaunchLibrary.mockResolvedValue({ canceled: true, assets: [] });
        const result = await uploadProfilePic(userId);
        expect(result).toEqual({ data: null, error: null });
    });

    it('returns error if no assets selected', async () => {
        mockRequestPermissions.mockResolvedValue({ status: 'granted' });
        mockLaunchLibrary.mockResolvedValue({ canceled: false, assets: [] });

        const result = await uploadProfilePic(userId);
        expect(result.error).toBe('No file selected.');
    });

    it('returns error if file is too large', async () => {
        mockRequestPermissions.mockResolvedValue({ status: 'granted' });
        mockLaunchLibrary.mockResolvedValue({
            canceled: false,
            assets: [mockAsset],
        });
        mockGetFileSize.mockResolvedValue(999 * 1024 * 1024);
        const result = await uploadProfilePic(userId);
        expect(result.error).toContain('too large');
    });

    it('returns error if db update fails', async () => {
        mockRequestPermissions.mockResolvedValue({ status: 'granted' });
        mockLaunchLibrary.mockResolvedValue({ canceled: false, assets: [] });
        mockGetFileSize.mockResolvedValue(100);
        mockFrom.mockReturnValue({
            update: jest.fn().mockReturnValue({
                eq: jest
                    .fn()
                    .mockResolvedValue({ error: new Error('DB error') }),
            }),
        });
        const result = await uploadProfilePic(userId);
        expect(result.error).toBeTruthy();
    });
});

// uploadPostImage
describe('uploadPostImage', () => {
    it('returns error if authorId is invalid', async () => {
        const result = await uploadPostImage('no-es-uuid', mockAsset);
        expect(result.error).toContain('author ID');
    });

    it('uploads image successfully', async () => {
        const result = await uploadPostImage(userId, mockAsset);
        expect(result.error).toBeNull();
        expect(result.data?.mediaType).toBe('image');
        expect(result.data?.publicUrl).toBe('https://cdn.example.com/file.jpg');
    });

    it('returns error if image is too large', async () => {
        mockGetFileSize.mockResolvedValue(999 * 1024 * 1024);
        const result = await uploadPostImage(userId, mockAsset);
        expect(result.error).toContain('too large');
    });

    it('returns error if resized image is too large', async () => {
        mockGetFileSize
            .mockResolvedValueOnce(1024)
            .mockResolvedValueOnce(999 * 1024 * 1024);
        const result = await uploadPostImage(userId, mockAsset);
        expect(result.error).toBe('The processed image is too large.');
    });

    it('uploads video successfully', async () => {
        const videoAsset = {
            ...mockAsset,
            uri: 'file://video.mp4',
            type: 'video' as const,
        };
        mockGetMimeType.mockReturnValue('video/mp4');
        const result = await uploadPostImage(userId, videoAsset);
        expect(result.error).toBeNull();
        expect(result.data?.mediaType).toBe('video');
    });

    it('returns error if video is too large', async () => {
        const videoAsset = {
            ...mockAsset,
            uri: 'file://video.mp4',
            type: 'video' as const,
        };
        mockGetFileSize.mockResolvedValue(999 * 1024 * 1024);
        const result = await uploadPostImage(userId, videoAsset);
        expect(result.error).toContain('too large');
    });

    it('returns error if getMimeType throws', async () => {
        mockGetMimeType.mockImplementation(() => {
            throw new Error('File type not allowed.');
        });
        const result = await uploadPostImage(userId, mockAsset);
        expect(result.error).toBe('File type not allowed.');
    });

    it('returns error if uploadToStorage fails', async () => {
        mockUploadToStorage.mockRejectedValue(new Error('NetworkError'));
        const result = await uploadPostImage(userId, mockAsset);
        expect(result.error).toBe('Network error. Check your connection.');
    });

    it('respects custom maxWidth option', async () => {
        await uploadPostImage(userId, mockAsset, { maxWidth: 500 });
        expect(mockResizeImage).toHaveBeenCalledWith(
            expect.anything(),
            500,
            expect.anything()
        );
    });
});

// uploadMultiple
describe('uploadMultiple', () => {
    it('returns error if authorId is invalid', async () => {
        const result = await uploadMultiple('no-es-uuid', [mockAsset]);
        expect(result.error).toContain('author ID');
    });

    it('returns empty result for empty assets array', async () => {
        const result = await uploadMultiple(userId, []);
        expect(result).toEqual({
            data: { successful: [], failed: [] },
            error: null,
        });
    });

    it('returns error if assets exceed max batch size', async () => {
        const assets = Array(11).fill(mockAsset);
        const result = await uploadMultiple(userId, assets);
        expect(result.error).toContain('Maximum');
    });

    it('uploads multiple assets successfully', async () => {
        const result = await uploadMultiple(userId, [mockAsset, mockAsset]);
        expect(result.data?.successful).toHaveLength(2);
        expect(result.data?.failed).toHaveLength(0);
    });

    it('tracks failed uploads', async () => {
        mockUploadToStorage
            .mockResolvedValueOnce('https://cdn.example.com/file.jpg')
            .mockRejectedValueOnce(new Error('NetworkError'));

        const result = await uploadMultiple(userId, [mockAsset, mockAsset]);
        expect(result.data?.successful).toHaveLength(1);
        expect(result.data?.failed).toHaveLength(1);
        expect(result.data?.failed[0]).toContain('Archivo 2');
    });
});

// getPublicUrl
describe('getPublicUrl', () => {
    it('returns public url from storage', () => {
        const url = getPublicUrl('post-images', 'uid-1/file.jpg');
        expect(url).toBe('https://cdn.example.com/file.jpg');
        expect(mockStorageFrom).toHaveBeenCalledWith('post-images');
    });
});
