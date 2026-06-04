import { signUp } from "@/services/supabase/auth/auth.sign-up";
import { mockAuth, mockFrom } from "@/__mocks__/supabaseMock";
import { waitForProfile } from "@/services/supabase/auth/auth.helpers";

jest.mock("@/lib/supabase/client", () => ({
    supabase: require("@/__mocks__/supabaseMock").supabase,
}));

jest.mock("@/services/supabase/auth/auth.helpers", () => ({
    ...jest.requireActual("@/services/supabase/auth/auth.helpers"),
    waitForProfile: jest.fn(),
}));

const mockWaitForProfile = waitForProfile as jest.Mock;

const validParams = {
    email: "nito@nitomail.com",
    password: "nitoseña123",
    full_name: "Rogelio Camacho",
    username: "elnito7"
};

const mockProfile = {
    user_id: "uid-1", full_name: "Rogelio Camacho", username: "elnito7", 
    email: "nito@nitomail.com", profile_pic: null,
    created_at: "", updated_at: "",
};

beforeEach(() => jest.clearAllMocks());

describe("signUp", () => {
    it("successfully registers a new user", async () => {
        const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
        const eq = jest.fn().mockReturnValue({ maybeSingle });
        const select = jest.fn().mockReturnValue({ eq });
        mockFrom.mockReturnValue({ select });

        mockAuth.signUp.mockResolvedValue({
            data: { user: { id: "uid-1" } },
            error: null,
        });
        mockWaitForProfile.mockResolvedValue(mockProfile);

        const result = await signUp(validParams);
        expect(result).toEqual({ data:mockProfile, error: null });
    });

    it("throws error if username is already in use", async () => {
        const maybeSingle = jest.fn().mockResolvedValue({
            data: { user_id: "some-uid" }, error: null,
        });
        const eq = jest.fn().mockReturnValue({ maybeSingle });
        const select = jest.fn().mockReturnValue({ eq });
        mockFrom.mockReturnValue({ select });

        const result = await signUp(validParams);
        expect(result.error).toBe("Ese nombre de usuario ya está en uso.");
        expect(mockAuth.signUp).not.toHaveBeenCalled();
    });

    it("throws error if email has invalid format", async () => {
        const result = await signUp({ ...validParams, email: "olanosoyunemail" });
        expect(result.error).toBe("El email no tiene un formato válido.");
    });

    it("throws error if user is already registered", async () => {
        const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
        const eq = jest.fn().mockReturnValue({ maybeSingle });
        const select = jest.fn().mockReturnValue({ eq });
        mockFrom.mockReturnValue({ select });

        mockAuth.signUp.mockResolvedValue({
            data: { user: null },
            error: new Error("User already registered"),
        });

        const result = await signUp(validParams);
        expect(result.error).toBe("Ya existe una cuenta con ese email.");
    });
});