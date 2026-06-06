import { onAuthStateChange } from "@/services/supabase/auth/auth.session";
import { mockAuth } from "@/__mocks__/supabaseMock";
import { fetchProfile } from "@/services/supabase/auth/auth.helpers";

jest.mock("@/lib/supabase/client", () => ({
    supabase: require("@/__mocks__/supabaseMock").supabase,
}));

jest.mock("@/services/supabase/auth/auth.helpers", () => ({
    fetchProfile: jest.fn(),
}));

const mockFetchProfile = fetchProfile as jest.Mock;

const mockProfile = {
    user_id: "uid-1", full_name: "Rogelio Camacho", username: "elnito7",
    email: "nito@nitomail.com", profile_pic: null,
    created_at: "", updated_at: "",
};

// helper para simular el disparo del evento
function setupAuthStateChange(event: string, session: any) {
    let capturedCallback: Function;
    const mockUnsubscribe = jest.fn();

    mockAuth.onAuthStateChange.mockImplementation((cb: Function) => {
        capturedCallback = cb;
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
    });

    return {
        fire: () => capturedCallback(event, session),
        mockUnsubscribe,
    };
}

beforeEach(() => jest.clearAllMocks());

describe("onAuthStateChange", () => {
    it("returns an unsubscribe function", () => {
        const mockUnsubscribe = jest.fn();
        mockAuth.onAuthStateChange.mockReturnValue({
            data: { subscription: { unsubscribe: mockUnsubscribe } },
        });

        const unsubscribe = onAuthStateChange(jest.fn());
        expect(typeof unsubscribe).toBe("function");

        unsubscribe();
        expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it("calls callback with null if session is missing", async () => {
        const callback = jest.fn();
        const { fire } = setupAuthStateChange("SIGNED_IN", null);

        onAuthStateChange(callback);
        await fire();

        expect(callback).toHaveBeenCalledWith(null);
    });

    it("calls callback with profile on SIGNED_IN", async () => {
        mockFetchProfile.mockResolvedValue(mockProfile);
        const callback = jest.fn();
        const { fire } = setupAuthStateChange("SIGNED_IN", { user: { id: "uid-1" } });

        onAuthStateChange(callback);
        await fire();

        expect(callback).toHaveBeenCalledWith(mockProfile);
    });

    it("calls callback with profile on TOKEN_REFRESHED", async () => {
        mockFetchProfile.mockResolvedValue(mockProfile);
        const callback = jest.fn();
        const { fire } = setupAuthStateChange("TOKEN_REFRESHED", { user: { id: "uid-1" } });

        onAuthStateChange(callback);
        await fire();

        expect(callback).toHaveBeenCalledWith(mockProfile);
    });

    it("calls callback with profile on INITIAL_SESSION", async () => {
        mockFetchProfile.mockResolvedValue(mockProfile);
        const callback = jest.fn();
        const { fire } = setupAuthStateChange("INITIAL_SESSION", { user: { id: "uid-1" } });

        onAuthStateChange(callback);
        await fire();

        expect(callback).toHaveBeenCalledWith(mockProfile);
    });

    it("calls callback with null if fetchProfile throws", async () => {
        mockFetchProfile.mockRejectedValue(new Error("DB error"));
        const callback = jest.fn();
        const { fire } = setupAuthStateChange("SIGNED_IN", { user: { id: "uid-1" } });

        onAuthStateChange(callback);
        await fire();

        expect(callback).toHaveBeenCalledWith(null);
    });

    it("calls callback with null on SIGNED_OUT", async () => {
        const callback = jest.fn();
        const { fire } = setupAuthStateChange("SIGNED_OUT", { user: { id: "uid-1" } });

        onAuthStateChange(callback);
        await fire();

        expect(callback).toHaveBeenCalledWith(null);
    });

    it("does not call callback on unhandled event", async () => {
        const callback = jest.fn();
        const { fire } = setupAuthStateChange("PASSWORD_RECOVERY", { user: { id: "uid-1" } });

        onAuthStateChange(callback);
        await fire();

        expect(callback).not.toHaveBeenCalled();
    });
});