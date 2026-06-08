import {
    enrichUsersWithRelationship,
    notifyFollow,
    fetchRelationshipStatus,
    fetchBlockStatus,
} from "@/services/supabase/social/social.queries";
import { mockFrom, supabase } from "@/__mocks__/supabaseMock";

jest.mock("@/lib/supabase/client", () => ({
    supabase: require("@/__mocks__/supabaseMock").supabase,
}));

const currentUserId = "550e8400-e29b-41d4-a716-446655440000";
const targetUserId = "550e8400-e29b-41d4-a716-446655440001";

beforeEach(() => {
    jest.clearAllMocks();
    (supabase as any).rpc = jest.fn();
});

describe("enrichUsersWithRelationship", () => {
    it("returns an empty array when there are no user ids", async () => {
        const result = await enrichUsersWithRelationship([], currentUserId);

        expect(result).toEqual([]);
        expect((supabase as any).rpc).not.toHaveBeenCalled();
    });

    it("calls the rpc and returns the enriched users", async () => {
        const enriched = [{ user_id: targetUserId, i_follow_them: true, is_friend: false }];
        (supabase as any).rpc.mockResolvedValue({ data: enriched, error: null });

        const result = await enrichUsersWithRelationship([targetUserId], currentUserId);

        expect((supabase as any).rpc).toHaveBeenCalledWith("get_users_with_relationship", {
            user_ids: [targetUserId],
            current_user_id: currentUserId,
        });
        expect(result).toEqual(enriched);
    });

    it("returns an empty array when the rpc returns no data", async () => {
        (supabase as any).rpc.mockResolvedValue({ data: null, error: null });

        const result = await enrichUsersWithRelationship([targetUserId], currentUserId);

        expect(result).toEqual([]);
    });

    it("throws when the rpc fails", async () => {
        (supabase as any).rpc.mockResolvedValue({ data: null, error: new Error("DB Error") });

        await expect(enrichUsersWithRelationship([targetUserId], currentUserId)).rejects.toThrow(
            "DB Error",
        );
    });
});

describe("notifyFollow", () => {
    it("inserts a new_follow notification", () => {
        const insert = jest.fn().mockResolvedValue({ error: null });
        mockFrom.mockReturnValue({ insert });

        notifyFollow(currentUserId, targetUserId);

        expect(mockFrom).toHaveBeenCalledWith("notifications");
        expect(insert).toHaveBeenCalledWith({
            user_id: targetUserId,
            type: "new_follow",
            actor_id: currentUserId,
        });
    });

    it("does not throw when the insert fails", () => {
        const insert = jest.fn().mockRejectedValue(new Error("DB Error"));
        mockFrom.mockReturnValue({ insert });

        expect(() => notifyFollow(currentUserId, targetUserId)).not.toThrow();
    });
});

describe("fetchRelationshipStatus", () => {
    it("returns the parsed relationship status", async () => {
        const single = jest.fn().mockResolvedValue({
            data: {
                i_follow_them: true,
                they_follow_me: false,
                is_friend: false,
                is_blocked: false,
                blocked_me: false,
            },
            error: null,
        });
        (supabase as any).rpc.mockReturnValue({ single });

        const result = await fetchRelationshipStatus(currentUserId, targetUserId);

        expect((supabase as any).rpc).toHaveBeenCalledWith("get_relationship_status", {
            current_user_id: currentUserId,
            target_user_id: targetUserId,
        });
        expect(result).toEqual({
            i_follow_them: true,
            they_follow_me: false,
            is_friend: false,
            is_blocked: false,
            blocked_me: false,
        });
    });

    it("throws when the rpc fails", async () => {
        const single = jest.fn().mockResolvedValue({ data: null, error: new Error("DB Error") });
        (supabase as any).rpc.mockReturnValue({ single });

        await expect(fetchRelationshipStatus(currentUserId, targetUserId)).rejects.toThrow(
            "DB Error",
        );
    });
});

describe("fetchBlockStatus", () => {
    it("returns the parsed block status", async () => {
        const single = jest.fn().mockResolvedValue({
            data: { a_blocked_b: true, b_blocked_a: false },
            error: null,
        });
        (supabase as any).rpc.mockReturnValue({ single });

        const result = await fetchBlockStatus(currentUserId, targetUserId);

        expect((supabase as any).rpc).toHaveBeenCalledWith("check_blocks_between", {
            user_a: currentUserId,
            user_b: targetUserId,
        });
        expect(result).toEqual({ a_blocked_b: true, b_blocked_a: false });
    });

    it("throws when the rpc fails", async () => {
        const single = jest.fn().mockResolvedValue({ data: null, error: new Error("DB Error") });
        (supabase as any).rpc.mockReturnValue({ single });

        await expect(fetchBlockStatus(currentUserId, targetUserId)).rejects.toThrow("DB Error");
    });
});
