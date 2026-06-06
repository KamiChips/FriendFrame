import { changePassword, resetPassword } from "@/services/supabase/auth/auth.password";
import { mockAuth } from "@/__mocks__/supabaseMock";

jest.mock("@/lib/supabase/client", () => ({
    supabase: require("@/__mocks__/supabaseMock").supabase,
}));

jest.mock("@/services/supabase/auth/auth.helpers", () => ({
    ...jest.requireActual("@/services/supabase/auth/auth.helpers"),
    validateEmail: jest.requireActual("@/services/supabase/auth/auth.helpers").validateEmail,
    validatePassword: jest.requireActual("@/services/supabase/auth/auth.helpers").validatePassword,
    validateRedirectUrl: jest.requireActual("@/services/supabase/auth/auth.helpers").validateRedirectUrl,
}));

beforeEach(() => jest.clearAllMocks());

describe("changePassword", () => {
    it("changes password successfully", async () => {
        mockAuth.updateUser.mockResolvedValue({ error: null });

        const result = await changePassword("nuevaSeña123");
        expect(result).toEqual({ data: null, error: null });
        expect(mockAuth.updateUser).toHaveBeenCalledWith({ password: "nuevaSeña123" });
    });

    it("throws error if password is invalid", async () => {
        const result = await changePassword("");
        expect(result.error).toBeTruthy();
        expect(mockAuth.updateUser).not.toHaveBeenCalled();
    });

    it("throws error if supabase returns error", async () => {
        mockAuth.updateUser.mockResolvedValue({ error: new Error("Auth error") });

        const result = await changePassword("nuevaSeña123");
        expect(result.error).toBeTruthy();
    });
});

describe("resetPassword", () => {
    it("sends reset email successfully", async () => {
        mockAuth.resetPasswordForEmail.mockResolvedValue({ error: null });

        const result = await resetPassword("nito@nitomail.com", "myapp://auth/callback");
        expect(result).toEqual({ data: null, error: null });
        expect(mockAuth.resetPasswordForEmail).toHaveBeenCalledWith(
            "nito@nitomail.com",
            expect.objectContaining({ redirectTo: "myapp://auth/callback" }),
        );
    });

    it("throws error if email is invalid", async () => {
        const result = await resetPassword("notanemail", "myapp://auth/callback");
        expect(result.error).toBeTruthy();
        expect(mockAuth.resetPasswordForEmail).not.toHaveBeenCalled();
    });

    it("throws error if redirectTo is invalid", async () => {
        const result = await resetPassword("nito@nitomail.com", "noesunaurl");
        expect(result.error).toBeTruthy();
        expect(mockAuth.resetPasswordForEmail).not.toHaveBeenCalled();
    });

    it("throws error if supabase returns error", async () => {
        mockAuth.resetPasswordForEmail.mockResolvedValue({ error: new Error("Network error") });

        const result = await resetPassword("nito@nitomail.com", "myapp://auth/callback");
        expect(result.error).toBeTruthy();
    });
});