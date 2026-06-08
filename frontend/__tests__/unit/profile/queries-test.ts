import { getProfile, getProfileStats, getMyProfile, searchUsers } from "@/services/supabase/profile/queries";
import { mockFrom, supabase } from "@/__mocks__/supabaseMock";
import { computeStats } from "@/services/supabase/profile/profile.helper";
import { getAuthUser } from "@/services/supabase/helpers/validation";

jest.mock("@/lib/supabase/client", () => ({
    supabase: require("@/__mocks__/supabaseMock").supabase,
}));

jest.mock("@/services/supabase/helpers/validation", () => ({
    ...jest.requireActual("@/services/supabase/helpers/validation"),
    getAuthUser: jest.fn(),
}));

jest.mock("@/services/supabase/profile/profile.helper", () => ({
    ...jest.requireActual("@/services/supabase/profile/profile.helper"),
    computeStats: jest.fn(),
}));

const mockGetAuthUser = getAuthUser as jest.Mock;
const mockComputeStats = computeStats as jest.Mock;

const currentUserId = "550e8400-e29b-41d4-a716-446655440000";
const targetUserId = "550e8400-e29b-41d4-a716-446655440001";

const userProfile = {
    user_id: targetUserId,
    full_name: "Target User",
    username: "target",
    email: "target@example.com",
    profile_pic: null,
    created_at: "",
};

const stats = {
    followers_count: 1,
    following_count: 2,
    friends_count: 1,
    posts_count: 3,
    fragments_count: 4,
    publications_count: 7,
};

const relationship = {
    i_follow_them: true,
    they_follow_me: false,
    is_friend: false,
    is_blocked: false,
    blocked_me: false,
};

beforeEach(() => {
    jest.clearAllMocks();
    (supabase as any).rpc = jest.fn();
});

describe("getProfile", () => {
    it("returns the full profile with stats and relationship", async () => {
        const single = jest.fn().mockResolvedValue({ data: userProfile, error: null });
        const eq = jest.fn().mockReturnValue({ single });
        const select = jest.fn().mockReturnValue({ eq });
        mockFrom.mockReturnValue({ select });

        mockComputeStats.mockResolvedValue(stats);

        const singleRel = jest.fn().mockResolvedValue({ data: relationship, error: null });
        (supabase as any).rpc.mockReturnValue({ single: singleRel });

        const result = await getProfile(targetUserId, currentUserId);

        expect(result).toEqual({
            data: {
                ...userProfile,
                stats,
                i_follow_them: true,
                is_following_me: false,
                is_friend: false,
                is_blocked: false,
                blocked_me: false,
            },
            error: null,
        });
    });

    it("returns error when the profile query fails", async () => {
        const single = jest.fn().mockResolvedValue({ data: null, error: new Error("DB Error") });
        const eq = jest.fn().mockReturnValue({ single });
        const select = jest.fn().mockReturnValue({ eq });
        mockFrom.mockReturnValue({ select });

        mockComputeStats.mockResolvedValue(stats);

        const singleRel = jest.fn().mockResolvedValue({ data: relationship, error: null });
        (supabase as any).rpc.mockReturnValue({ single: singleRel });

        const result = await getProfile(targetUserId, currentUserId);

        expect(result.error).toBe("Ocurrió un error inesperado.");
        expect(result.data).toBeNull();
    });

    it("returns error when the relationship query fails", async () => {
        const single = jest.fn().mockResolvedValue({ data: userProfile, error: null });
        const eq = jest.fn().mockReturnValue({ single });
        const select = jest.fn().mockReturnValue({ eq });
        mockFrom.mockReturnValue({ select });

        mockComputeStats.mockResolvedValue(stats);

        const singleRel = jest.fn().mockResolvedValue({ data: null, error: new Error("DB Error") });
        (supabase as any).rpc.mockReturnValue({ single: singleRel });

        const result = await getProfile(targetUserId, currentUserId);

        expect(result.error).toBe("Ocurrió un error inesperado.");
        expect(result.data).toBeNull();
    });

    it("returns error with an invalid UUID", async () => {
        const result = await getProfile("not-a-uuid", currentUserId);

        expect(result.error).not.toBeNull();
        expect(result.data).toBeNull();
    });
});

describe("getProfileStats", () => {
    it("returns the profile stats", async () => {
        mockComputeStats.mockResolvedValue(stats);

        const result = await getProfileStats(targetUserId);

        expect(result).toEqual({ data: stats, error: null });
    });

    it("returns error when computing stats fails", async () => {
        mockComputeStats.mockRejectedValue(new Error("DB Error"));

        const result = await getProfileStats(targetUserId);

        expect(result.error).toBe("Ocurrió un error inesperado.");
        expect(result.data).toBeNull();
    });

    it("returns error with an invalid UUID", async () => {
        const result = await getProfileStats("not-a-uuid");

        expect(result.error).not.toBeNull();
        expect(result.data).toBeNull();
    });
});

describe("getMyProfile", () => {
    it("returns the current user's profile with stats", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);

        const single = jest.fn().mockResolvedValue({ data: userProfile, error: null });
        const eq = jest.fn().mockReturnValue({ single });
        const select = jest.fn().mockReturnValue({ eq });
        mockFrom.mockReturnValue({ select });

        mockComputeStats.mockResolvedValue(stats);

        const result = await getMyProfile();

        expect(result).toEqual({
            data: { ...userProfile, stats },
            error: null,
        });
    });

    it("returns error when the profile query fails", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);

        const single = jest.fn().mockResolvedValue({ data: null, error: new Error("DB Error") });
        const eq = jest.fn().mockReturnValue({ single });
        const select = jest.fn().mockReturnValue({ eq });
        mockFrom.mockReturnValue({ select });

        mockComputeStats.mockResolvedValue(stats);

        const result = await getMyProfile();

        expect(result.error).toBe("Ocurrió un error inesperado.");
        expect(result.data).toBeNull();
    });

    it("returns error when there is no active session", async () => {
        mockGetAuthUser.mockRejectedValue(new Error("No hay sesión activa."));

        const result = await getMyProfile();

        expect(result.error).toBe("No hay sesión activa.");
        expect(result.data).toBeNull();
    });
});

describe("searchUsers", () => {
    it("returns an empty list when the query is shorter than the minimum length", async () => {
        const result = await searchUsers("a", currentUserId);

        expect(result).toEqual({ data: [], error: null });
        expect((supabase as any).rpc).not.toHaveBeenCalled();
    });

    it("returns an error when the query exceeds the maximum length", async () => {
        const result = await searchUsers("a".repeat(51), currentUserId);

        expect(result.data).toEqual([]);
        expect(result.error).toBe("La búsqueda no puede superar 50 caracteres.");
    });

    it("returns the search results from the rpc", async () => {
        const searchResult = {
            user_id: targetUserId,
            full_name: "Target User",
            username: "target",
            profile_pic: null,
            is_friend: false,
            i_follow_them: false,
        };

        (supabase as any).rpc.mockResolvedValue({ data: [searchResult], error: null });

        const result = await searchUsers("target", currentUserId);

        expect((supabase as any).rpc).toHaveBeenCalledWith("search_users", {
            search_query: "target",
            current_user_id: currentUserId,
            result_limit: 20,
        });
        expect(result).toEqual({ data: [searchResult], error: null });
    });

    it("returns an empty list when the rpc returns no data", async () => {
        (supabase as any).rpc.mockResolvedValue({ data: null, error: null });

        const result = await searchUsers("target", currentUserId);

        expect(result).toEqual({ data: [], error: null });
    });

    it("returns error when the rpc fails", async () => {
        (supabase as any).rpc.mockResolvedValue({ data: null, error: new Error("DB Error") });

        const result = await searchUsers("target", currentUserId);

        expect(result.error).toBe("Ocurrió un error inesperado.");
        expect(result.data).toBeNull();
    });

    it("returns error with an invalid UUID", async () => {
        const result = await searchUsers("target", "not-a-uuid");

        expect(result.error).not.toBeNull();
        expect(result.data).toBeNull();
    });
});
