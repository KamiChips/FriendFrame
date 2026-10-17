import {
    validateCommentOwnership,
    validateGroupOwnership,
    validateMessageOwnership,
    validatePostOwnership,
    validateProfileOwnership,
} from '@/services/supabase/helpers/authorization';

const mockFrom = jest.fn();
const mockMaybeSingle = jest.fn();
const mockQuery = {
    select: jest.fn(),
    eq: jest.fn(),
    maybeSingle: mockMaybeSingle,
};

jest.mock('@/lib/supabase/client', () => ({
    supabase: { from: (...args: any[]) => mockFrom(...args) },
}));

const USER = 'test-user-123';
const OTHER = 'another-123';
const RESOURCE = 'resource-123';

beforeEach(() => {
    jest.clearAllMocks();
    mockFrom.mockReturnValue(mockQuery);
    mockQuery.select.mockReturnValue(mockQuery);
    mockQuery.eq.mockReturnValue(mockQuery);
});

const dbValidators = [
    {
        name: 'validatePostOwnership',
        fn: validatePostOwnership,
        table: 'posts',
        idColumn: 'post_id',
        ownerColumn: 'author_id',
        notFound: 'Post Not found',
    },
    {
        name: 'validateCommentOwnership',
        fn: validateCommentOwnership,
        table: 'comments',
        idColumn: 'comment_id',
        ownerColumn: 'user_id',
        notFound: 'Comment Not found',
    },
    {
        name: 'validateMessageOwnership',
        fn: validateMessageOwnership,
        table: 'messages',
        idColumn: 'message_id',
        ownerColumn: 'sender_id',
        notFound: 'Message Not found',
    },
    {
        name: 'validateGroupOwnership',
        fn: validateGroupOwnership,
        table: 'chat',
        idColumn: 'chat_id',
        ownerColumn: 'created_by',
        notFound: 'Group chat Not found',
    },
];

describe.each(dbValidators)(
    '$name',
    ({ fn, table, idColumn, ownerColumn, notFound }) => {
        it('passes when resource exists and user is the owner', async () => {
            mockMaybeSingle.mockResolvedValueOnce({
                data: { [ownerColumn]: USER },
                error: null,
            });
            await expect(fn(RESOURCE, USER)).resolves.toBeUndefined();
        });

        it('fitlers query by id and owner', async () => {
            mockMaybeSingle.mockResolvedValueOnce({
                data: { [ownerColumn]: USER },
                error: null,
            });
            await fn(RESOURCE, USER);

            expect(mockFrom).toHaveBeenCalledWith(table);
            expect(mockQuery.eq).toHaveBeenCalledWith(idColumn, RESOURCE);
            expect(mockQuery.eq).toHaveBeenCalledWith(ownerColumn, USER);
        });

        it('throws "Not found" if ownership validation fails', async () => {
            mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
            await expect(fn(RESOURCE, USER)).rejects.toThrow(notFound);
        });

        it('throws error if validation fails for other reasons', async () => {
            const dbError = new Error('connection lost');
            mockMaybeSingle.mockResolvedValueOnce({
                data: null,
                error: dbError,
            });
            await expect(fn(RESOURCE, USER)).rejects.toBe(dbError);
        });
    }
);

describe('validateProfileOwnership', () => {
    it('does not throw id user id is authenticated', () => {
        expect(() => validateProfileOwnership(USER, USER)).not.toThrow();
    });

    it('throws "Profile not found" if the ids are different', () => {
        expect(() => validateProfileOwnership(OTHER, USER)).toThrow(
            'Profile Not found'
        );
    });
});
