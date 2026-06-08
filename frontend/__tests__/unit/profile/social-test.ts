import { getFollowers, getFollowing, getFriends } from "@/services/supabase/profile/social";
import { supabase } from "@/__mocks__/supabaseMock";

jest.mock("@/lib/supabase/client", () => ({
    supabase: require("@/__mocks__/supabaseMock").supabase,
}));

const currentUserId = "550e8400-e29b-41d4-a716-446655440000";
const targetUserId = "550e8400-e29b-41d4-a716-446655440001";

const searchResult = {
    user_id: targetUserId,
    full_name: "Target User",
    username: "target",
    profile_pic: null,
    is_friend: false,
    i_follow_them: false,
};

beforeEach(() => {
    jest.clearAllMocks();
    (supabase as any).rpc = jest.fn();
});

describe("getFollowers", () => {
    it("returns the followers of a profile", async () => {
        (supabase as any).rpc.mockResolvedValue({ data: [searchResult], error: null });

        const result = await getFollowers(targetUserId, currentUserId);

        expect((supabase as any).rpc).toHaveBeenCalledWith("get_followers_with_relationship", {
            target_user_id: targetUserId,
            current_user_id: currentUserId,
            p_limit: 30,
            p_offset: 0,
        });
        expect(result).toEqual({ data: [searchResult], error: null });
    });

    it("forwards pagination params to the rpc", async () => {
        (supabase as any).rpc.mockResolvedValue({ data: [], error: null });

        await getFollowers(targetUserId, currentUserId, { page: 1, limit: 10 });

        expect((supabase as any).rpc).toHaveBeenCalledWith("get_followers_with_relationship", {
            target_user_id: targetUserId,
            current_user_id: currentUserId,
            p_limit: 10,
            p_offset: 10,
        });
    });

    it("returns an empty list when the rpc returns no data", async () => {
        (supabase as any).rpc.mockResolvedValue({ data: null, error: null });

        const result = await getFollowers(targetUserId, currentUserId);

        expect(result).toEqual({ data: [], error: null });
    });

    it("returns error when the rpc fails", async () => {
        (supabase as any).rpc.mockResolvedValue({ data: null, error: new Error("DB Error") });

        const result = await getFollowers(targetUserId, currentUserId);

        expect(result.error).toBe("DB Error");
        expect(result.data).toBeNull();
    });

    it("returns error with an invalid UUID", async () => {
        const result = await getFollowers("not-a-uuid", currentUserId);

        expect(result.error).not.toBeNull();
        expect(result.data).toBeNull();
    });
});

describe("getFollowing", () => {
    it("returns the users a profile follows", async () => {
        (supabase as any).rpc.mockResolvedValue({ data: [searchResult], error: null });

        const result = await getFollowing(targetUserId, currentUserId);

        expect((supabase as any).rpc).toHaveBeenCalledWith("get_following_with_relationship", {
            target_user_id: targetUserId,
            current_user_id: currentUserId,
            p_limit: 30,
            p_offset: 0,
        });
        expect(result).toEqual({ data: [searchResult], error: null });
    });

    it("returns an empty list when the rpc returns no data", async () => {
        (supabase as any).rpc.mockResolvedValue({ data: null, error: null });

        const result = await getFollowing(targetUserId, currentUserId);

        expect(result).toEqual({ data: [], error: null });
    });

    it("returns error when the rpc fails", async () => {
        (supabase as any).rpc.mockResolvedValue({ data: null, error: new Error("DB Error") });

        const result = await getFollowing(targetUserId, currentUserId);

        expect(result.error).toBe("DB Error");
        expect(result.data).toBeNull();
    });

    it("returns error with an invalid UUID", async () => {
        const result = await getFollowing("not-a-uuid", currentUserId);

        expect(result.error).not.toBeNull();
        expect(result.data).toBeNull();
    });
});

describe("getFriends", () => {
    it("returns the friends of a user", async () => {
        const friend = {
            user_id: targetUserId,
            full_name: "Target User",
            username: "target",
            profile_pic: null,
            created_at: "",
        };
        (supabase as any).rpc.mockResolvedValue({ data: [friend], error: null });

        const result = await getFriends(targetUserId);

        expect((supabase as any).rpc).toHaveBeenCalledWith("get_friends", { target_user_id: targetUserId });
        expect(result).toEqual({ data: [friend], error: null });
    });

    it("returns error when the rpc fails", async () => {
        (supabase as any).rpc.mockResolvedValue({ data: null, error: new Error("DB Error") });

        const result = await getFriends(targetUserId);

        expect(result.error).toBe("DB Error");
        expect(result.data).toBeNull();
    });

    it("returns error with an invalid UUID", async () => {
        const result = await getFriends("not-a-uuid");

        expect(result.error).not.toBeNull();
        expect(result.data).toBeNull();
    });
});
