import { signUp } from "@/services/supabase/auth/auth.sign-up";
import { supabaseAdmin } from "./helpers/supabase-test-client";

// usuario fijo para los tests de signup
const TEST_USER = {
    email: process.env.TEST_SIGNUP_EMAIL!,
    password: process.env.TEST_USER_PASSWORD!,
    full_name: "Integration Testing",
    username: "integration_test_2"
};

async function deleteTestUser(email: string) {
    // HABIA QUE BORRAR TAMBIEN EL PERFIL AAAAAAAAAAAAAA
    await supabaseAdmin
        .from("users")
        .delete()
        .eq("username", TEST_USER.username);
    
    const { data } = await supabaseAdmin.auth.admin.listUsers();
    const user = data.users.find((u) => u.email === email);
    if (user) await supabaseAdmin.auth.admin.deleteUser(user.id);
}

beforeAll(async () => {
    await deleteTestUser(TEST_USER.email);
});

afterAll(async () => {
    await deleteTestUser(TEST_USER.email);
});

describe("signUp - Integration", () => {
    it("create user and profile in BD successfully", async () => {
        const result = await signUp(TEST_USER);

        expect(result.error).toBeNull();
        expect(result.data?.email.toLowerCase()).toBe(TEST_USER.email.toLowerCase());
        expect(result.data?.username).toBe(TEST_USER.username);

        // Verificar que el perfil exista en la BD
        const { data: profile } = await supabaseAdmin
            .from("users")
            .select("*")
            .eq("username", TEST_USER.username)
            .single();
        
        expect(profile).not.toBeNull();
    });

    it("throw error if username is already in use", async () => {
        await signUp(TEST_USER);

        const result = await signUp({
            ...TEST_USER,
            email: "otro_integration@gmail.com"
        });

        expect(result.error).toBe("Ese nombre de usuario ya está en uso.");
    });

    it("throw error if email is already registered", async () => {
        await signUp(TEST_USER);

        const result = await signUp({
            ...TEST_USER,
            username: "otro_integration_username"
        });

        expect(result.error).toBe("Ya existe una cuenta con ese email.");
    });
});

describe("signUp - Integration - Database", () => {
    it("profile fields match the data sent", async () => {
        await signUp(TEST_USER);

        const { data: profile } = await supabaseAdmin
            .from("users")
            .select("*")
            .eq("username", TEST_USER.username)
            .single();

        expect(profile.full_name).toBe(TEST_USER.full_name);
        expect(profile.email).toBe(TEST_USER.email);
        expect(profile.username).toBe(TEST_USER.username);
        expect(profile.profile_pic).toBeNull(); 
    });

    it("profile is created with timestamps", async () => {
        await signUp(TEST_USER);

        const { data: profile } = await supabaseAdmin
            .from("users")
            .select("created_at, updated_at")
            .eq("username", TEST_USER.username)
            .single();

        expect(profile?.created_at).not.toBeNull();
        expect(profile?.updated_at).not.toBeNull();
    });

    it("does not create duplicate profile on repeated signup", async () => {
        await signUp(TEST_USER);
        await signUp(TEST_USER); // intento duplicado

        const { data: profiles } = await supabaseAdmin
            .from("users")
            .select("*")
            .eq("username", TEST_USER.username);

        expect(profiles?.length).toBe(1);
    });
});