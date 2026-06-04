import {
    validateEmail,
    validatePassword,
    validateUsername,
    validateFullName,
    validateRedirectUrl,
    fetchProfile,
    waitForProfile,
} from "@/services/supabase/auth/auth.helpers";

jest.mock("@/lib/supabase/client", () => ({
    supabase: require("@/__mocks__/supabaseMock").supabase,
}));

import { mockFrom } from "@/__mocks__/supabaseMock";

// validateEmail
describe("validateEmail", () => {
    it("transforms to lowercase and removes whitespace", () => {
        expect(validateEmail("  NITOELMASPRO@EMAIL.COM  ")).toBe("nitoelmaspro@email.com");
    });

    it("throws error when email is empty", () => {
        expect(() => validateEmail("   ")).toThrow("El email es requerido.");
    });

    it("throws error if format is invalid", () => {
        expect(() => validateEmail("no-he-comido-aiuda")).toThrow(
        "El email no tiene un formato válido."
        );
    });
});

// validatePassword
describe("validatePassword", () => {
    it("works finw with a valid password", () => {
        expect(() => validatePassword("vivoabasedecafe123")).not.toThrow();
    });

    it("throws error when password is empty", () => {
        expect(() => validatePassword("")).toThrow("La contraseña es requerida.");
    });

    it("throws error if password is too short", () => {
        expect(() => validatePassword("ola")).toThrow(
            "La contraseña debe tener al menos 8 caracteres."
        );
    });
});

// validateUsername
describe("validateUsername", () => {
    it("transforms to lowercase", () => {
        expect(validateUsername("NitoPro_1")).toBe("nitopro_1");
    });

    it("throws error when username is empty", () => {
        expect(() => validateUsername("")).toThrow(
            "El nombre de usuario es requerido."
        );
    });

    it("throws error when username contains invalid characters", () => {
        expect(() => validateUsername("NI tO!")).toThrow(
            "El username solo puede contener"
        );
    });

    it("throws error if username is too short (< 3 chars)", () => {
        expect(() => validateUsername("a")).toThrow();
    });
});

// validateFullName
describe("validateFullName", () => {
    it("removes whitespace from name", () => {
        expect(validateFullName("  Rogelio Camacho  ")).toBe("Rogelio Camacho");
    });

    it("throws error when name is empty", () => {
        expect(() => validateFullName("   ")).toThrow(
            "El nombre completo es requerido."
        );
    });

    it("throws error when name is too long (> 120 chars)", () => {
        expect(() => validateFullName("A".repeat(121))).toThrow(
            "El nombre no puede superar"
        );
    });
});

// validateRedirectUrl
describe("validateRedirectUrl", () => {
    it("doesn't throw an error with a valid URL", () => {
        expect(() => validateRedirectUrl("myapp://reset")).not.toThrow();
    });

    it("throws error with an invalid URL", () => {
        expect(() => validateRedirectUrl("quesesto")).toThrow(
            "La URL de redirección no es válida."
        );
    });

    it("throws error with an empty string", () => {
        expect(() => validateRedirectUrl("")).toThrow();
    });
});

// fetchProfile
describe("fetchProfile", () => {
    const mockProfile = {
        user_id: "uid-1",
        full_name: "Rogelio Camacho",
        username: "elnito7",
        email: "nito@nitomail.com",
        profile_pic: null,
        created_at: "",
        updated_at: "",
    };

    beforeEach(() => jest.clearAllMocks());

    it("Returns profile if it exists", async () => {
        const single = jest.fn().mockResolvedValue({ data: mockProfile, error: null });
        const eq    = jest.fn().mockReturnValue({ single });
        const select = jest.fn().mockReturnValue({ eq });
        mockFrom.mockReturnValue({ select });

        const result = await fetchProfile("uid-1");
        expect(result).toEqual(mockProfile);
    });

    it("throws an error if supabase returns an error", async () => {
        const single = jest.fn().mockResolvedValue({ data: null, error: new Error("DB error") });
        const eq    = jest.fn().mockReturnValue({ single });
        const select = jest.fn().mockReturnValue({ eq });
        mockFrom.mockReturnValue({ select });

        await expect(fetchProfile("uid-1")).rejects.toThrow("DB error");
    });

    it("throws an error if data is null", async () => {
        const single = jest.fn().mockResolvedValue({ data: null, error: null });
        const eq    = jest.fn().mockReturnValue({ single });
        const select = jest.fn().mockReturnValue({ eq });
        mockFrom.mockReturnValue({ select });

        await expect(fetchProfile("uid-1")).rejects.toThrow(
            "No se encontró el perfil del usuario."
        );
    });
});