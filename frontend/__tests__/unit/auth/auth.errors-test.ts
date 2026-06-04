import { parseAuthError } from "@/services/supabase/auth/auth.errors";

describe("parseAuthError", () => {
    it("Shows message for null error", () => {
        expect(parseAuthError(null)).toBe("Error desconocido");
    });

    it("translates 'User already registered'", () => {
        expect(parseAuthError(new Error("User already registered")))
            .toBe("Ya existe una cuenta con ese email.");
    });

    it("translates 'Invalid login credentials'", () => {
        expect(parseAuthError(new Error("Invalid login credentials")))
            .toBe("Email o contraseña incorrectos.");
    });

    it("translates 'Email not confirmed'", () => {
        expect(parseAuthError(new Error("Email not confirmed")))
            .toBe("Confirma tu email antes de iniciar sesión.");
    });
    
    it("translates 'Auth session missing'", () => {
        expect(parseAuthError(new Error("Auth session missing")))
            .toBe("No hay sesión activa.");
    });

    it("translates network errors", () => {
        expect(parseAuthError(new Error("NetworkError")))
            .toBe("Error de red. Verifica tu conexión.");
    });

    it("translates fetch errors (failed to fetch)", () => {
        expect(parseAuthError(new Error("Failed to fetch")))
            .toBe("Error de red. Verifica tu conexión.");
    });

    it("translates 'Unable to validate email address'", () => {
        expect(parseAuthError(new Error("Unable to validate email address")))
            .toBe("El email no tiene un formato válido.");
    });

    it("shows proper message sent as parameter", () => {
        const m = "El email no tiene formato válido."
        expect(parseAuthError(new Error(m))).toBe(m);
    });

    it("returns a generic error message for unknown messages.", () => {
        expect(parseAuthError(new Error("sepa que paso aqui")))
            .toBe("Ocurrió un error inesperado.");
    });
})