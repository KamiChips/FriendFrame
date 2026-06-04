import { getCurrentUser, signIn, signInWithGoogle, signOut } from "@/services/supabase/auth/auth.sign-in";
import { mockAuth } from "@/__mocks__/supabaseMock";
import { fetchProfile } from "@/services/supabase/auth/auth.helpers";

jest.mock("@/services/supabase/auth/auth.session", () => ({
    supabase: require("@/__mocks__/supabaseMock").supabase,
}));

jest.mock("@/services/supabase/auth/auth.helpers", () => ({
    ...jest.requireActual("@/services/supabase/auth/auth.helpers"),
    fetchProfile: jest.fn(),
    validateEmail: jest.requireActual("@/services/supabase/auth/auth.helpers").validateEmail,
    validateRedirectUrl: jest.requireActual("@/services/supabase/auth/auth.helpers").validateRedirectUrl,
}));

jest.mock("@/services/supabase/auth/auth.notifications", () => ({
    _removeCurrentDeviceToken: jest.fn().mockResolvedValue(undefined),
}));

const mockFetchProfile = fetchProfile as jest.Mock;

const mockProfile = {
    user_id: "uid-1", full_name: "Rogelio Camacho", username: "elnito7",
    email: "nitomail@nito.com", profile_pic: null,
    created_at: "", updated_at: "",
};

beforeEach(() => jest.clearAllMocks());

// signIn
describe("singIn", () => {
    it("Successfully signs in", async () => {
        mockAuth.signInWithPassword.mockResolvedValue({
            data: { user: { id: "uid-1" } }, error: null,
        });
        mockFetchProfile.mockResolvedValue(mockProfile);

        const result = await signIn({ email: "nitomail@nito.com", password: "quesueñocolega123" });
        expect(result).toEqual({ data: mockProfile, error: null });
    });

    it("throws error when password is empty", async () => {
        const result = await signIn({ email: "nitomail@nito.com", password: "" });
        expect(result.error).toBe("La contraseña es requerida.");
    });

    it("throws error if the credentials are invalid", async () => {
        mockAuth.signInWithPassword.mockResolvedValue({
            data: { user: null },
            error: new Error("Invalid login credentials")
        });

        const result = await signIn({ email: "nitomail@nito.com", password: "noesestajajasequivoco" });
        expect(result.error).toBe("Email o contraseña incorrectos.");
    });
});

// signOut
describe("signOut", () => {
    it("logs out successfully", async () => {
        mockAuth.getUser.mockResolvedValue({ data: { user: null } });
        mockAuth.signOut.mockResolvedValue({ error: null });

        const result = await signOut();
        expect(result).toEqual({ data: null, error: null });
    });

    it("throws error if action fails", async () => {
        mockAuth.getUser.mockResolvedValue({ data: { user: null } });
        mockAuth.signOut.mockResolvedValue({ error: new Error("NetworkError") });

        const result = await signOut();
        expect(result.error).toBe("Error de red. Verifica tu conexión.");
    });
});

// getCurrentUser
describe("getCurrentUser", () => {
    it("return null if there is no active session", async () => {
        mockAuth.getUser.mockResolvedValue({
            data: { user: null },
            error: { message: "Auth session missing" },
        });

        const result = await getCurrentUser();
        expect(result).toEqual({ data: null, error: null });
    });

    it("returns profiel if there is an active session", async () => {
            mockAuth.getUser.mockResolvedValue({
            data: { user: { id: "uid-1" } }, error: null,
        });
        mockFetchProfile.mockResolvedValue(mockProfile);

        const result = await getCurrentUser();
        expect(result).toEqual({ data: mockProfile, error: null });
    });
});

// signInWithGoogle
describe("signInWithGoogle", () => {
    it("throws error if the redirection URL is invalid", async () => {
        const result = await signInWithGoogle("nosequevaaqui");
        expect(result.error).toBe("La URL de redirección no es válida.");
    });

    it("calls signInWithOAuth with google provider", async () => {
        mockAuth.signInWithOAuth.mockResolvedValue({ error: null });
        const result = await signInWithGoogle("myapp://auth/callback");
        expect(mockAuth.signInWithOAuth).toHaveBeenCalledWith(
            expect.objectContaining({ provider: "google" })
        );
        expect(result.error).toBeNull();
    });
});