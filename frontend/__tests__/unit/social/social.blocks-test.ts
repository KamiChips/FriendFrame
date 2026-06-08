import {
    blockUser,
    unblockUser,
    isBlocked,
    getBlockedUsers,
} from "@/services/supabase/social/social.blocks";
import { mockFrom } from "@/__mocks__/supabaseMock";
import { getAuthUser } from "@/services/supabase/helpers/validation";
import { fetchBlockStatus } from "@/services/supabase/social/social.queries";

jest.mock("@/lib/supabase/client", () => ({
    supabase: require("@/__mocks__/supabaseMock").supabase,
}));

jest.mock("@/services/supabase/helpers/validation", () => ({
    ...jest.requireActual("@/services/supabase/helpers/validation"),
    getAuthUser: jest.fn(),
}));

jest.mock("@/services/supabase/social/social.queries", () => ({
    fetchBlockStatus: jest.fn(),
}));

const mockGetAuthUser = getAuthUser as jest.Mock;
const mockFetchBlockStatus = fetchBlockStatus as jest.Mock;

const currentUserId = "550e8400-e29b-41d4-a716-446655440000";
const targetUserId = "550e8400-e29b-41d4-a716-446655440001";

const block = {
    block_id: "550e8400-e29b-41d4-a716-446655440030",
    blocker_id: currentUserId,
    blocked_id: targetUserId,
    created_at: "",
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe("blockUser", () => {
    it("blocks a user successfully", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);

        const single = jest.fn().mockResolvedValue({ data: block, error: null });
        const select = jest.fn().mockReturnValue({ single });
        const insert = jest.fn().mockReturnValue({ select });

        const eqDelete2 = jest.fn().mockResolvedValue({ error: null });
        const eqDelete1 = jest.fn().mockReturnValue({ eq: eqDelete2 });
        const deleteFn = jest.fn().mockReturnValue({ eq: eqDelete1 });

        mockFrom.mockImplementation((table: string) => {
            if (table === "blocks") return { insert };
            if (table === "follows") return { delete: deleteFn };
            return {};
        });

        const result = await blockUser(targetUserId);

        expect(result).toEqual({ data: block, error: null });
        expect(deleteFn).toHaveBeenCalledTimes(2);
    });

    it("returns error when trying to block yourself", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);

        const result = await blockUser(currentUserId);

        expect(result.error).toBe("No puedes bloquearte a ti mismo.");
    });

    it("returns error when the insert fails", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);

        const single = jest.fn().mockResolvedValue({ data: null, error: new Error("DB Error") });
        const select = jest.fn().mockReturnValue({ single });
        const insert = jest.fn().mockReturnValue({ select });

        mockFrom.mockReturnValue({ insert });

        const result = await blockUser(targetUserId);

        expect(result.error).toBe("Ocurrió un error inesperado.");
    });

    it("returns error with an invalid UUID", async () => {
        const result = await blockUser("not-a-uuid");

        expect(result.error).not.toBeNull();
        expect(result.data).toBeNull();
    });
});

describe("unblockUser", () => {
    it("unblocks a user successfully", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);

        const eq2 = jest.fn().mockResolvedValue({ error: null });
        const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
        const deleteFn = jest.fn().mockReturnValue({ eq: eq1 });

        mockFrom.mockReturnValue({ delete: deleteFn });

        const result = await unblockUser(targetUserId);

        expect(result).toEqual({ data: null, error: null });
    });

    it("returns error when delete fails", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);

        const eq2 = jest.fn().mockResolvedValue({ error: new Error("DB Error") });
        const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
        const deleteFn = jest.fn().mockReturnValue({ eq: eq1 });

        mockFrom.mockReturnValue({ delete: deleteFn });

        const result = await unblockUser(targetUserId);

        expect(result.error).toBe("Ocurrió un error inesperado.");
    });

    it("returns error with an invalid UUID", async () => {
        const result = await unblockUser("not-a-uuid");

        expect(result.error).not.toBeNull();
    });
});

describe("isBlocked", () => {
    it("returns the block status in both directions", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);
        mockFetchBlockStatus.mockResolvedValue({ a_blocked_b: true, b_blocked_a: false });

        const result = await isBlocked(targetUserId);

        expect(result).toEqual({
            data: { i_blocked_them: true, they_blocked_me: false },
            error: null,
        });
    });

    it("returns false in both directions when there is no block", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);
        mockFetchBlockStatus.mockResolvedValue({ a_blocked_b: false, b_blocked_a: false });

        const result = await isBlocked(targetUserId);

        expect(result).toEqual({
            data: { i_blocked_them: false, they_blocked_me: false },
            error: null,
        });
    });

    it("returns error with an invalid UUID", async () => {
        const result = await isBlocked("not-a-uuid");

        expect(result.error).not.toBeNull();
        expect(result.data).toBeNull();
    });
});

describe("getBlockedUsers", () => {
    it("returns the list of blocked users", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);

        const range = jest.fn().mockResolvedValue({
            data: [
                {
                    created_at: "2024-01-01T00:00:00.000Z",
                    blocked: {
                        user_id: targetUserId,
                        full_name: "Target User",
                        username: "target",
                        profile_pic: null,
                    },
                },
            ],
            error: null,
        });
        const order = jest.fn().mockReturnValue({ range });
        const eq = jest.fn().mockReturnValue({ order });
        const select = jest.fn().mockReturnValue({ eq });

        mockFrom.mockReturnValue({ select });

        const result = await getBlockedUsers();

        expect(result).toEqual({
            data: [
                {
                    user_id: targetUserId,
                    full_name: "Target User",
                    username: "target",
                    profile_pic: null,
                    blocked_at: "2024-01-01T00:00:00.000Z",
                },
            ],
            error: null,
        });
    });

    it("returns an empty list when there are no blocked users", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);

        const range = jest.fn().mockResolvedValue({ data: [], error: null });
        const order = jest.fn().mockReturnValue({ range });
        const eq = jest.fn().mockReturnValue({ order });
        const select = jest.fn().mockReturnValue({ eq });

        mockFrom.mockReturnValue({ select });

        const result = await getBlockedUsers();

        expect(result).toEqual({ data: [], error: null });
    });

    it("returns error when the query fails", async () => {
        mockGetAuthUser.mockResolvedValue(currentUserId);

        const range = jest.fn().mockResolvedValue({ data: null, error: new Error("DB Error") });
        const order = jest.fn().mockReturnValue({ range });
        const eq = jest.fn().mockReturnValue({ order });
        const select = jest.fn().mockReturnValue({ eq });

        mockFrom.mockReturnValue({ select });

        const result = await getBlockedUsers();

        expect(result.error).toBe("Ocurrió un error inesperado.");
        expect(result.data).toBeNull();
    });
});
