import { getProfileFeed } from "@/services/supabase/posts/feed";
import { mockFrom } from "@/__mocks__/supabaseMock";
import { attachCountsBatch } from "@/services/supabase/posts/helpers";

jest.mock("@/lib/supabase/client", () => ({
    supabase: require("@/__mocks__/supabaseMock").supabase,
}));

jest.mock("@/services/supabase/posts/helpers", () => ({
    ...jest.requireActual("@/services/supabase/posts/helpers"),
    attachCountsBatch: jest.fn(),
    normalizePagination: jest.requireActual("@/services/supabase/posts/helpers").normalizePagination,
    parseError: jest.requireActual("@/services/supabase/posts/helpers").parseError,
}));

const mockAttachCountsBatch = attachCountsBatch as jest.Mock;

const profileOwnerId = "550e8400-e29b-41d4-a716-446655440001";
const currentUserId  = "550e8400-e29b-41d4-a716-446655440000";

const mockPost = { post_id: "post-1", account_owner_id: profileOwnerId, created_at: "2024-01-02T00:00:00Z" };
const mockFragment = { fragment_id: "frag-1", account_owner_id: profileOwnerId, created_at: "2024-01-01T00:00:00Z" };

const makeRangeMock = (data: any, error: any = null) => ({
    select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({ data, error }),
            }),
        }),
    }),
});

beforeEach(() => {
    jest.clearAllMocks();
    mockAttachCountsBatch.mockResolvedValue({ postsMap: new Map(), fragmentsMap: new Map() });
});

describe("getProfileFeed", () => {
    it("returns empty array when no posts or fragments", async () => {
        mockFrom
            .mockReturnValueOnce(makeRangeMock([]))
            .mockReturnValueOnce(makeRangeMock([]));

        const result = await getProfileFeed(profileOwnerId, currentUserId);
        expect(result).toEqual({ data: [], error: null });
    });

    it("returns sorted feed with posts and fragments", async () => {
        mockFrom
            .mockReturnValueOnce(makeRangeMock([mockPost]))
            .mockReturnValueOnce(makeRangeMock([mockFragment]));

        mockAttachCountsBatch.mockResolvedValue({
            postsMap: new Map([["post-1", { likes_count: 3, comments_count: 1, shares_count: 0, liked_by_me: true }]]),
            fragmentsMap: new Map([["frag-1", { likes_count: 1, comments_count: 0, shares_count: 0, liked_by_me: false }]]),
        });

        const result = await getProfileFeed(profileOwnerId, currentUserId);
        expect(result.error).toBeNull();
        expect(result.data).toHaveLength(2);
        expect(result.data![0].type).toBe("post");   // más reciente primero
        expect(result.data![1].type).toBe("fragment");
    });

    it("uses default counts when post not in postsMap", async () => {
        mockFrom
            .mockReturnValueOnce(makeRangeMock([mockPost]))
            .mockReturnValueOnce(makeRangeMock([]));

        const result = await getProfileFeed(profileOwnerId, currentUserId);
        expect(result.data![0]).toMatchObject({ likes_count: 0, liked_by_me: false });
    });

    it("returns error if profileOwnerId is invalid", async () => {
        const result = await getProfileFeed("no-es-uuid", currentUserId);
        expect(result.data).toBeNull();
        expect(result.error).toContain("ID de perfil");
    });

    it("returns error if currentUserId is invalid", async () => {
        const result = await getProfileFeed(profileOwnerId, "no-es-uuid");
        expect(result.data).toBeNull();
        expect(result.error).toContain("ID de usuario");
    });

    it("returns error if posts query fails", async () => {
        mockFrom
            .mockReturnValueOnce(makeRangeMock(null, new Error("DB error")))
            .mockReturnValueOnce(makeRangeMock([]));

        const result = await getProfileFeed(profileOwnerId, currentUserId);
        expect(result.error).toBeTruthy();
    });

    it("returns error if fragments query fails", async () => {
        mockFrom
            .mockReturnValueOnce(makeRangeMock([]))
            .mockReturnValueOnce(makeRangeMock(null, new Error("DB error")));

        const result = await getProfileFeed(profileOwnerId, currentUserId);
        expect(result.error).toBeTruthy();
    });

    it("accepts pagination params", async () => {
        const rangeMock = jest.fn().mockResolvedValue({ data: [], error: null });
        const orderMock = jest.fn().mockReturnValue({ range: rangeMock });
        const eqMock = jest.fn().mockReturnValue({ order: orderMock });
        const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
        mockFrom.mockReturnValue({ select: selectMock });

        await getProfileFeed(profileOwnerId, currentUserId, { page: 1, limit: 10 });
        expect(rangeMock).toHaveBeenCalledWith(10, 19);
    });

    it("returns error if attachCountsBatch throws", async () => {
        mockFrom
            .mockReturnValueOnce(makeRangeMock([mockPost]))
            .mockReturnValueOnce(makeRangeMock([mockFragment]));

        mockAttachCountsBatch.mockRejectedValue(new Error("RPC error"));

        const result = await getProfileFeed(profileOwnerId, currentUserId);
        expect(result.error).toBeTruthy();
    });

    it("uses default counts when fragment not in fragmentsMap", async () => {
        mockFrom
            .mockReturnValueOnce(makeRangeMock([]))
            .mockReturnValueOnce(makeRangeMock([mockFragment]));

        mockAttachCountsBatch.mockResolvedValue({
            postsMap: new Map(),
            fragmentsMap: new Map(), // frag-1 no está
        });

        const result = await getProfileFeed(profileOwnerId, currentUserId);
        expect(result.data![0]).toMatchObject({ likes_count: 0, liked_by_me: false, type: "fragment" });
    });

    it("returns feed with only posts", async () => {
        mockFrom
            .mockReturnValueOnce(makeRangeMock([mockPost]))
            .mockReturnValueOnce(makeRangeMock([]));

        mockAttachCountsBatch.mockResolvedValue({
            postsMap: new Map([["post-1", { likes_count: 2, comments_count: 0, shares_count: 0, liked_by_me: false }]]),
            fragmentsMap: new Map(),
        });

        const result = await getProfileFeed(profileOwnerId, currentUserId);
        expect(result.data).toHaveLength(1);
        expect(result.data![0].type).toBe("post");
    });

    it("returns feed with only fragments", async () => {
        mockFrom
            .mockReturnValueOnce(makeRangeMock([]))
            .mockReturnValueOnce(makeRangeMock([mockFragment]));

        mockAttachCountsBatch.mockResolvedValue({
            postsMap: new Map(),
            fragmentsMap: new Map([["frag-1", { likes_count: 1, comments_count: 0, shares_count: 0, liked_by_me: true }]]),
        });

        const result = await getProfileFeed(profileOwnerId, currentUserId);
        expect(result.data).toHaveLength(1);
        expect(result.data![0].type).toBe("fragment");
    });
});