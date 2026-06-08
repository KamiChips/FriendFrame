import {
    getRelationshipStatus,
    getFriends,
} from "@/services/supabase/social/social.relationship";
import { mockFrom } from "@/__mocks__/supabaseMock";
import { getAuthUser } from "@/services/supabase/helpers/validation";
import { fetchRelationshipStatus } from "@/services/supabase/social/social.queries";

jest.mock("@/lib/supabase/client", () => ({
    supabase: require("@/__mocks__/supabaseMock").supabase,
}));

jest.mock("@/services/supabase/helpers/validation", () => ({
    ...jest.requireActual("@/services/supabase/helpers/validation"),
    getAuthUser: jest.fn(),
}));

jest.mock("@/services/supabase/social/social.queries", () => ({
    fetchRelationshipStatus: jest.fn(),
}));

const mockGetAuthUser = getAuthUser as jest.Mock;
const mockFetchRelationshipStatus = fetchRelationshipStatus as jest.Mock;

const currentUserId = "550e8400-e29b-41d4-a716-446655440000";
const targetUserId = "550e8400-e29b-41d4-a716-446655440001";

beforeEach(() => {
    jest.clearAllMocks();
});

describe("getRelationshipStatus", () => {
    it("returns the relationship status between two users", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);
        mockFetchRelationshipStatus.mockResolvedValue({
            i_follow_them: true,
            they_follow_me: true,
            is_friend: true,
            is_blocked: false,
            blocked_me: false,
        });

        const result = await getRelationshipStatus(targetUserId);

        expect(result).toEqual({
            data: {
                i_follow_them: true,
                they_follow_me: true,
                is_friend: true,
                is_blocked: false,
                blocked_me: false,
            },
            error: null,
        });
        expect(mockFetchRelationshipStatus).toHaveBeenCalledWith(currentUserId, targetUserId);
    });

    it("returns error when fetching the relationship status fails", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);
        mockFetchRelationshipStatus.mockRejectedValue(new Error("DB Error"));

        const result = await getRelationshipStatus(targetUserId);

        expect(result.error).toBe("Ocurrió un error inesperado.");
        expect(result.data).toBeNull();
    });

    it("returns a generic error when the failure has no message", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);
        mockFetchRelationshipStatus.mockRejectedValue(undefined);

        const result = await getRelationshipStatus(targetUserId);

        expect(result.error).toBe("Error desconocido");
        expect(result.data).toBeNull();
    });

    it("returns error with an invalid UUID", async () => {
        const result = await getRelationshipStatus("not-a-uuid");

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
        };

        const rpc = jest.fn().mockResolvedValue({
            data: [friend],
            error: null,
        });

        (require("@/__mocks__/supabaseMock").supabase as any).rpc = rpc;

        const result = await getFriends(currentUserId);

        expect(rpc).toHaveBeenCalledWith("get_friends", { target_user_id: currentUserId });
        expect(result).toEqual({
            data: [{ ...friend, i_follow_them: true, is_friend: true }],
            error: null,
        });
    });

    it("returns an empty list when the user has no friends", async () => {
        const rpc = jest.fn().mockResolvedValue({ data: [], error: null });
        (require("@/__mocks__/supabaseMock").supabase as any).rpc = rpc;

        const result = await getFriends(currentUserId);

        expect(result).toEqual({ data: [], error: null });
    });

    it("returns an empty list when the rpc returns no data", async () => {
        const rpc = jest.fn().mockResolvedValue({ data: null, error: null });
        (require("@/__mocks__/supabaseMock").supabase as any).rpc = rpc;

        const result = await getFriends(currentUserId);

        expect(result).toEqual({ data: [], error: null });
    });

    it("returns error when the rpc call fails", async () => {
        const rpc = jest.fn().mockResolvedValue({ data: null, error: new Error("DB Error") });
        (require("@/__mocks__/supabaseMock").supabase as any).rpc = rpc;

        const result = await getFriends(currentUserId);

        expect(result.error).toBe("Ocurrió un error inesperado.");
        expect(result.data).toBeNull();
    });

    it("returns error with an invalid UUID", async () => {
        const result = await getFriends("not-a-uuid");

        expect(result.error).not.toBeNull();
        expect(result.data).toBeNull();
    });
});
