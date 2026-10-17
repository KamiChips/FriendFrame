import {
    deletePostImage,
    deleteProfilePic,
} from '@/services/supabase/storage/deleteMedia';
import { mockFrom, mockStorageFrom } from '@/__mocks__/supabaseMock';
import { getAuthUser } from '@/services/supabase/helpers/validation';

jest.mock('@/lib/supabase/client', () => ({
    supabase: require('@/__mocks__/supabaseMock').supabase,
}));

jest.mock('@/services/supabase/storage/storage.helpers', () => ({
    ...jest.requireActual('@/services/supabase/storage/storage.helpers'),
}));

jest.mock('@/services/supabase/helpers/validation', () => ({
    ...jest.requireActual('@/services/supabase/helpers/validation'),
    getAuthUser: jest.fn(),
}));

const userId = '550e8400-e29b-41d4-a716-446655440000';
const OTHER_USER = '660e8400-e29b-41d4-a716-446655440111';
const postImageUrl = (ownerId: string) =>
    `https://cdn.example.com/storage/v1/object/public/post-images/${ownerId}/file.jpg`;
const validUrl = postImageUrl(userId);

const mockRemove = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
    (getAuthUser as jest.Mock).mockResolvedValue(userId);
    mockRemove.mockResolvedValue({ error: null });
    mockStorageFrom.mockReturnValue({
        remove: mockRemove,
    });
});

describe('deletePostImage', () => {
    it('returns null if publicUrl is empty', async () => {
        const result = await deletePostImage('');
        expect(result).toEqual({ data: null, error: null });
    });

    it('returns null if url has no valid path', async () => {
        const result = await deletePostImage(
            'https://cdn.example.com/other/file.jpg'
        );
        expect(result).toEqual({ data: null, error: null });
    });

    it('deletes file successfully', async () => {
        const result = await deletePostImage(validUrl);
        expect(result).toEqual({ data: null, error: null });
        expect(mockStorageFrom).toHaveBeenCalledWith('post-images');
    });

    it('ignores 404 errors', async () => {
        mockStorageFrom.mockReturnValue({
            remove: jest
                .fn()
                .mockResolvedValue({ error: new Error('404 Not Found') }),
        });

        const result = await deletePostImage(validUrl);
        expect(result).toEqual({ data: null, error: null });
    });

    it('ignores Not Found errors', async () => {
        mockStorageFrom.mockReturnValue({
            remove: jest
                .fn()
                .mockResolvedValue({ error: new Error('Not Found') }),
        });

        const result = await deletePostImage(validUrl);
        expect(result).toEqual({ data: null, error: null });
    });

    it('returns error on unexpected storage error', async () => {
        mockStorageFrom.mockReturnValue({
            remove: jest
                .fn()
                .mockResolvedValue({ error: new Error('NetworkError') }),
        });

        const result = await deletePostImage(validUrl);
        expect(result.error).toBe('Network error. Check your connection.');
    });

    it('rejects an image from another user and stops deletion', async () => {
        const result = await deletePostImage(postImageUrl(OTHER_USER));
        expect(result.error).toBeTruthy();
        expect(mockRemove).not.toHaveBeenCalled();
    });

    it('throws error and stops deletion if session is null', async () => {
        (getAuthUser as jest.Mock).mockRejectedValueOnce(
            new Error('Not authenticated')
        );

        const result = await deletePostImage(validUrl);

        expect(result.error).toBeTruthy();
        expect(mockRemove).not.toHaveBeenCalled();
    });
});

describe('deleteProfilePic', () => {
    beforeEach(() => {
        mockFrom.mockReturnValue({
            update: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null }),
            }),
        });
    });

    it('returns error if userId is invalid', async () => {
        const result = await deleteProfilePic('no-es-uuid');
        expect(result.error).toContain('user ID');
    });

    it('deletes profile pic and updates db successfully', async () => {
        const result = await deleteProfilePic(userId);
        expect(result).toEqual({ data: null, error: null });
        expect(mockStorageFrom).toHaveBeenCalledWith('profile-pictures');
        expect(mockFrom).toHaveBeenCalledWith('users');
    });

    it('ignores 404 storage errors', async () => {
        mockStorageFrom.mockReturnValue({
            remove: jest
                .fn()
                .mockResolvedValue({ error: new Error('404 Not Found') }),
        });

        const result = await deleteProfilePic(userId);
        expect(result).toEqual({ data: null, error: null });
    });

    it('ignores Not Found storage errors', async () => {
        mockStorageFrom.mockReturnValue({
            remove: jest
                .fn()
                .mockResolvedValue({ error: new Error('Not Found') }),
        });

        const result = await deleteProfilePic(userId);
        expect(result).toEqual({ data: null, error: null });
    });

    it('returns error on unexpected storage error', async () => {
        mockStorageFrom.mockReturnValue({
            remove: jest
                .fn()
                .mockResolvedValue({ error: new Error('NetworkError') }),
        });

        const result = await deleteProfilePic(userId);
        expect(result.error).toBe('Network error. Check your connection.');
    });

    it('returns error if db update fails', async () => {
        mockFrom.mockReturnValue({
            update: jest.fn().mockReturnValue({
                eq: jest
                    .fn()
                    .mockResolvedValue({ error: new Error('DB error') }),
            }),
        });

        const result = await deleteProfilePic(userId);
        expect(result.error).toBeTruthy();
    });

    it('rejecrs deleting a profile picture from another user', async () => {
        (getAuthUser as jest.Mock).mockResolvedValueOnce(OTHER_USER);
        const result = await deleteProfilePic(userId);

        expect(result.error).toBeTruthy();
        expect(mockStorageFrom).not.toHaveBeenCalled();
        expect(mockFrom).not.toHaveBeenCalled();
    });

    it('throws error if session is null', async () => {
        (getAuthUser as jest.Mock).mockRejectedValueOnce(
            new Error('Not authenticated')
        );
        const result = await deleteProfilePic(userId);

        expect(result.error).toBeTruthy();
        expect(mockStorageFrom).not.toHaveBeenCalled();
    });
});
