import {
    normalizePagination,
    parseError,
    computeStats,
} from '@/services/supabase/profile/profile.helper';
import { supabase } from '@/__mocks__/supabaseMock';

jest.mock('@/lib/supabase/client', () => ({
    supabase: require('@/__mocks__/supabaseMock').supabase,
}));

beforeEach(() => {
    jest.clearAllMocks();
    (supabase as any).rpc = jest.fn();
});

describe('normalizePagination', () => {
    it('returns the default limit and offset when no params are given', () => {
        expect(normalizePagination({})).toEqual({ limit: 30, offset: 0 });
    });

    it('computes the offset based on the page and limit', () => {
        expect(normalizePagination({ page: 2, limit: 10 })).toEqual({
            limit: 10,
            offset: 20,
        });
    });

    it('clamps the limit to the maximum page limit', () => {
        expect(normalizePagination({ limit: 100 })).toEqual({
            limit: 50,
            offset: 0,
        });
    });

    it('clamps the limit to a minimum of 1', () => {
        expect(normalizePagination({ limit: 0 })).toEqual({
            limit: 1,
            offset: 0,
        });
    });

    it('clamps the page to a minimum of 0', () => {
        expect(normalizePagination({ page: -5, limit: 10 })).toEqual({
            limit: 10,
            offset: 0,
        });
    });
});

describe('parseError', () => {
    it('returns a generic message when there is no error', () => {
        expect(parseError(null)).toBe('Unknown error');
    });

    it('maps PGRST116 to a not-found message', () => {
        expect(parseError(new Error('PGRST116'))).toBe('User not found.');
    });

    it("maps 'No rows found' to a not-found message", () => {
        expect(parseError(new Error('No rows found'))).toBe('User not found.');
    });

    it('maps row-level security errors to a permission message', () => {
        expect(parseError(new Error('row-level security violation'))).toBe(
            'You do not have permission to perform this action.'
        );
    });

    it('maps network errors to a connection message', () => {
        expect(parseError(new Error('NetworkError'))).toBe(
            'Network error. Check your connection.'
        );
        expect(parseError(new Error('Failed to fetch'))).toBe(
            'Network error. Check your connection.'
        );
    });

    it('returns the original message when it starts with a known prefix', () => {
        expect(parseError(new Error('No active session.'))).toBe(
            'No active session.'
        );
        expect(parseError(new Error('Invalid user ID.'))).toBe(
            'Invalid user ID.'
        );
        expect(
            parseError(new Error('The search cannot exceed 50 characters.'))
        ).toBe('The search cannot exceed 50 characters.');
        expect(parseError(new Error('User not found.'))).toBe(
            'User not found.'
        );
    });

    it('returns a generic message for unknown errors', () => {
        expect(parseError(new Error('something unexpected'))).toBe(
            'An unexpected error occurred.'
        );
    });
});

describe('computeStats', () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';

    it('returns the parsed profile stats', async () => {
        const single = jest.fn().mockResolvedValue({
            data: {
                followers_count: 1,
                following_count: 2,
                friends_count: 1,
                posts_count: 3,
                fragments_count: 4,
            },
            error: null,
        });
        (supabase as any).rpc.mockReturnValue({ single });

        const result = await computeStats(userId);

        expect((supabase as any).rpc).toHaveBeenCalledWith(
            'get_profile_stats',
            { target_user_id: userId }
        );
        expect(result).toEqual({
            followers_count: 1,
            following_count: 2,
            friends_count: 1,
            posts_count: 3,
            fragments_count: 4,
            publications_count: 7,
        });
    });

    it('defaults missing counts to 0', async () => {
        const single = jest.fn().mockResolvedValue({ data: {}, error: null });
        (supabase as any).rpc.mockReturnValue({ single });

        const result = await computeStats(userId);

        expect(result).toEqual({
            followers_count: 0,
            following_count: 0,
            friends_count: 0,
            posts_count: 0,
            fragments_count: 0,
            publications_count: 0,
        });
    });

    it('throws when the rpc fails', async () => {
        const single = jest
            .fn()
            .mockResolvedValue({ data: null, error: new Error('DB Error') });
        (supabase as any).rpc.mockReturnValue({ single });

        await expect(computeStats(userId)).rejects.toThrow('DB Error');
    });
});
