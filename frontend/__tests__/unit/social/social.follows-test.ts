import {
    followUser,
    unfollowUser,
    toggleFollow,
    isFollowing,
    getFollowing,
    getFollowers,
} from "@/services/supabase/social/social.follows";
import { mockFrom } from "@/__mocks__/supabaseMock";
import { getAuthUser } from "@/services/supabase/helpers/validation";
import {
    enrichUsersWithRelationship,
    fetchBlockStatus,
    fetchRelationshipStatus,
    notifyFollow,
} from "@/services/supabase/social/social.queries";

jest.mock("@/lib/supabase/client", () => ({
    supabase: require("@/__mocks__/supabaseMock").supabase,
}));

jest.mock("@/services/supabase/helpers/validation", () => ({
    ...jest.requireActual("@/services/supabase/helpers/validation"),
    getAuthUser: jest.fn(),
}));

jest.mock("@/services/supabase/social/social.queries", () => ({
    enrichUsersWithRelationship: jest.fn(),
    fetchBlockStatus: jest.fn(),
    fetchRelationshipStatus: jest.fn(),
    notifyFollow: jest.fn(),
}));

const mockGetAuthUser = getAuthUser as jest.Mock;
const mockFetchBlockStatus = fetchBlockStatus as jest.Mock;
const mockFetchRelationshipStatus = fetchRelationshipStatus as jest.Mock;
const mockEnrichUsers = enrichUsersWithRelationship as jest.Mock;
const mockNotifyFollow = notifyFollow as jest.Mock;

const currentUserId = "550e8400-e29b-41d4-a716-446655440000";
const targetUserId = "550e8400-e29b-41d4-a716-446655440001";

const follow = {
    follow_id: "550e8400-e29b-41d4-a716-446655440010",
    follower_id: currentUserId,
    following_id: targetUserId,
    created_at: "",
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe("followUser", () => {
    it("follows a user successfully", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);
        mockFetchBlockStatus.mockResolvedValue({ a_blocked_b: false, b_blocked_a: false });

        const single = jest.fn().mockResolvedValue({ data: follow, error: null });
        const select = jest.fn().mockReturnValue({ single });
        const insert = jest.fn().mockReturnValue({ select });

        const maybeSingle = jest.fn().mockResolvedValue({ data: null });
        const eq2 = jest.fn().mockReturnValue({ maybeSingle });
        const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
        const selectMutual = jest.fn().mockReturnValue({ eq: eq1 });

        mockFrom.mockImplementation((table: string) => {
            if (table === "follows") {
                return { insert, select: selectMutual };
            }
            return {};
        });

        const result = await followUser(targetUserId);

        expect(result).toEqual({
            data: { follow, is_friend: false },
            error: null,
        });
        expect(mockNotifyFollow).toHaveBeenCalledWith(currentUserId, targetUserId);
    });

    it("returns is_friend true when the target already follows back", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);
        mockFetchBlockStatus.mockResolvedValue({ a_blocked_b: false, b_blocked_a: false });

        const single = jest.fn().mockResolvedValue({ data: follow, error: null });
        const select = jest.fn().mockReturnValue({ single });
        const insert = jest.fn().mockReturnValue({ select });

        const maybeSingle = jest.fn().mockResolvedValue({ data: { follow_id: "mutual-1" } });
        const eq2 = jest.fn().mockReturnValue({ maybeSingle });
        const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
        const selectMutual = jest.fn().mockReturnValue({ eq: eq1 });

        mockFrom.mockImplementation((table: string) => {
            if (table === "follows") {
                return { insert, select: selectMutual };
            }
            return {};
        });

        const result = await followUser(targetUserId);

        expect(result.data?.is_friend).toBe(true);
    });

    it("returns error when trying to follow yourself", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);

        const result = await followUser(currentUserId);

        expect(result.error).toBe("No puedes seguirte a ti mismo.");
    });

    it("returns error when the current user has blocked the target", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);
        mockFetchBlockStatus.mockResolvedValue({ a_blocked_b: true, b_blocked_a: false });

        const result = await followUser(targetUserId);

        expect(result.error).toBe("Has bloqueado a este usuario.");
    });

    it("returns error when the target has blocked the current user", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);
        mockFetchBlockStatus.mockResolvedValue({ a_blocked_b: false, b_blocked_a: true });

        const result = await followUser(targetUserId);

        expect(result.error).toBe("No puedes seguir a este usuario.");
    });

    it("returns error when the insert fails", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);
        mockFetchBlockStatus.mockResolvedValue({ a_blocked_b: false, b_blocked_a: false });

        const single = jest.fn().mockResolvedValue({ data: null, error: new Error("DB Error") });
        const select = jest.fn().mockReturnValue({ single });
        const insert = jest.fn().mockReturnValue({ select });

        mockFrom.mockReturnValue({ insert });

        const result = await followUser(targetUserId);

        expect(result.error).toBe("Ocurrió un error inesperado.");
    });

    it("returns error with an invalid UUID", async () => {
        const result = await followUser("not-a-uuid");

        expect(result.error).not.toBeNull();
        expect(result.data).toBeNull();
    });
});

describe("unfollowUser", () => {
    it("unfollows a user successfully", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);

        const eq2 = jest.fn().mockResolvedValue({ error: null });
        const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
        const deleteFn = jest.fn().mockReturnValue({ eq: eq1 });

        mockFrom.mockReturnValue({ delete: deleteFn });

        const result = await unfollowUser(targetUserId);

        expect(result).toEqual({ data: null, error: null });
    });

    it("returns error when delete fails", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);

        const eq2 = jest.fn().mockResolvedValue({ error: new Error("DB Error") });
        const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
        const deleteFn = jest.fn().mockReturnValue({ eq: eq1 });

        mockFrom.mockReturnValue({ delete: deleteFn });

        const result = await unfollowUser(targetUserId);

        expect(result.error).toBe("Ocurrió un error inesperado.");
    });

    it("returns error with an invalid UUID", async () => {
        const result = await unfollowUser("not-a-uuid");

        expect(result.error).not.toBeNull();
    });
});

describe("toggleFollow", () => {
    it("unfollows when the current user already follows the target", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);
        mockFetchRelationshipStatus.mockResolvedValue({
            i_follow_them: true,
            they_follow_me: false,
            is_friend: false,
            is_blocked: false,
            blocked_me: false,
        });

        const eq2 = jest.fn().mockResolvedValue({ error: null });
        const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
        const deleteFn = jest.fn().mockReturnValue({ eq: eq1 });

        mockFrom.mockReturnValue({ delete: deleteFn });

        const result = await toggleFollow(targetUserId);

        expect(result).toEqual({
            data: { following: false, is_friend: false },
            error: null,
        });
    });

    it("follows when the current user does not follow the target", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);
        mockFetchRelationshipStatus.mockResolvedValue({
            i_follow_them: false,
            they_follow_me: true,
            is_friend: false,
            is_blocked: false,
            blocked_me: false,
        });

        const insert = jest.fn().mockResolvedValue({ error: null });
        mockFrom.mockReturnValue({ insert });

        const result = await toggleFollow(targetUserId);

        expect(result).toEqual({
            data: { following: true, is_friend: true },
            error: null,
        });
        expect(mockNotifyFollow).toHaveBeenCalledWith(currentUserId, targetUserId);
    });

    it("returns error when the current user is blocked by the target", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);
        mockFetchRelationshipStatus.mockResolvedValue({
            i_follow_them: false,
            they_follow_me: false,
            is_friend: false,
            is_blocked: false,
            blocked_me: true,
        });

        const result = await toggleFollow(targetUserId);

        expect(result.error).toBe("No puedes seguir a este usuario.");
    });

    it("returns error when the current user has blocked the target", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);
        mockFetchRelationshipStatus.mockResolvedValue({
            i_follow_them: false,
            they_follow_me: false,
            is_friend: false,
            is_blocked: true,
            blocked_me: false,
        });

        const result = await toggleFollow(targetUserId);

        expect(result.error).toBe("Has bloqueado a este usuario.");
    });

    it("returns error when the unfollow delete fails", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);
        mockFetchRelationshipStatus.mockResolvedValue({
            i_follow_them: true,
            they_follow_me: false,
            is_friend: false,
            is_blocked: false,
            blocked_me: false,
        });

        const eq2 = jest.fn().mockResolvedValue({ error: new Error("DB Error") });
        const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
        const deleteFn = jest.fn().mockReturnValue({ eq: eq1 });

        mockFrom.mockReturnValue({ delete: deleteFn });

        const result = await toggleFollow(targetUserId);

        expect(result.error).toBe("Ocurrió un error inesperado.");
    });

    it("returns error when the follow insert fails", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);
        mockFetchRelationshipStatus.mockResolvedValue({
            i_follow_them: false,
            they_follow_me: false,
            is_friend: false,
            is_blocked: false,
            blocked_me: false,
        });

        const insert = jest.fn().mockResolvedValue({ error: new Error("DB Error") });
        mockFrom.mockReturnValue({ insert });

        const result = await toggleFollow(targetUserId);

        expect(result.error).toBe("Ocurrió un error inesperado.");
    });

    it("returns error with an invalid UUID", async () => {
        const result = await toggleFollow("not-a-uuid");

        expect(result.error).not.toBeNull();
        expect(result.data).toBeNull();
    });
});

describe("isFollowing", () => {
    it("returns true when the current user follows the target", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);

        const maybeSingle = jest.fn().mockResolvedValue({ data: { follow_id: "f-1" } });
        const eq2 = jest.fn().mockReturnValue({ maybeSingle });
        const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
        const select = jest.fn().mockReturnValue({ eq: eq1 });

        mockFrom.mockReturnValue({ select });

        const result = await isFollowing(targetUserId);

        expect(result).toEqual({ data: true, error: null });
    });

    it("returns false when the current user does not follow the target", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);

        const maybeSingle = jest.fn().mockResolvedValue({ data: null });
        const eq2 = jest.fn().mockReturnValue({ maybeSingle });
        const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
        const select = jest.fn().mockReturnValue({ eq: eq1 });

        mockFrom.mockReturnValue({ select });

        const result = await isFollowing(targetUserId);

        expect(result).toEqual({ data: false, error: null });
    });

    it("returns error with an invalid UUID", async () => {
        const result = await isFollowing("not-a-uuid");

        expect(result.error).not.toBeNull();
        expect(result.data).toBeNull();
    });
});

describe("getFollowing", () => {
    it("returns enriched users that the profile follows", async () => {
        const range = jest.fn().mockResolvedValue({
            data: [{ following_id: targetUserId }],
            error: null,
        });
        const order = jest.fn().mockReturnValue({ range });
        const eq = jest.fn().mockReturnValue({ order });
        const select = jest.fn().mockReturnValue({ eq });

        mockFrom.mockReturnValue({ select });
        mockEnrichUsers.mockResolvedValue([{ user_id: targetUserId }]);

        const result = await getFollowing(currentUserId, currentUserId);

        expect(result).toEqual({ data: [{ user_id: targetUserId }], error: null });
        expect(mockEnrichUsers).toHaveBeenCalledWith([targetUserId], currentUserId);
    });

    it("returns an empty list when the profile follows nobody", async () => {
        const range = jest.fn().mockResolvedValue({ data: [], error: null });
        const order = jest.fn().mockReturnValue({ range });
        const eq = jest.fn().mockReturnValue({ order });
        const select = jest.fn().mockReturnValue({ eq });

        mockFrom.mockReturnValue({ select });

        const result = await getFollowing(currentUserId, currentUserId);

        expect(result).toEqual({ data: [], error: null });
    });

    it("returns error when the query fails", async () => {
        const range = jest.fn().mockResolvedValue({ data: null, error: new Error("DB Error") });
        const order = jest.fn().mockReturnValue({ range });
        const eq = jest.fn().mockReturnValue({ order });
        const select = jest.fn().mockReturnValue({ eq });

        mockFrom.mockReturnValue({ select });

        const result = await getFollowing(currentUserId, currentUserId);

        expect(result.error).toBe("Ocurrió un error inesperado.");
        expect(result.data).toBeNull();
    });

    it("returns error with an invalid UUID", async () => {
        const result = await getFollowing("not-a-uuid", currentUserId);

        expect(result.error).not.toBeNull();
        expect(result.data).toBeNull();
    });
});

describe("getFollowers", () => {
    it("returns enriched followers of the profile", async () => {
        const range = jest.fn().mockResolvedValue({
            data: [{ follower_id: targetUserId }],
            error: null,
        });
        const order = jest.fn().mockReturnValue({ range });
        const eq = jest.fn().mockReturnValue({ order });
        const select = jest.fn().mockReturnValue({ eq });

        mockFrom.mockReturnValue({ select });
        mockEnrichUsers.mockResolvedValue([{ user_id: targetUserId }]);

        const result = await getFollowers(currentUserId, currentUserId);

        expect(result).toEqual({ data: [{ user_id: targetUserId }], error: null });
        expect(mockEnrichUsers).toHaveBeenCalledWith([targetUserId], currentUserId);
    });

    it("returns an empty list when the profile has no followers", async () => {
        const range = jest.fn().mockResolvedValue({ data: [], error: null });
        const order = jest.fn().mockReturnValue({ range });
        const eq = jest.fn().mockReturnValue({ order });
        const select = jest.fn().mockReturnValue({ eq });

        mockFrom.mockReturnValue({ select });

        const result = await getFollowers(currentUserId, currentUserId);

        expect(result).toEqual({ data: [], error: null });
    });

    it("returns error when the query fails", async () => {
        const range = jest.fn().mockResolvedValue({ data: null, error: new Error("DB Error") });
        const order = jest.fn().mockReturnValue({ range });
        const eq = jest.fn().mockReturnValue({ order });
        const select = jest.fn().mockReturnValue({ eq });

        mockFrom.mockReturnValue({ select });

        const result = await getFollowers(currentUserId, currentUserId);

        expect(result.error).toBe("Ocurrió un error inesperado.");
        expect(result.data).toBeNull();
    });

    it("returns error with an invalid UUID", async () => {
        const result = await getFollowers("not-a-uuid", currentUserId);

        expect(result.error).not.toBeNull();
        expect(result.data).toBeNull();
    });
});
