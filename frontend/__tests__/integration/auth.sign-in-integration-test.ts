// __tests__/integration/auth.signin.integration.test.ts
import { signIn, signOut, getCurrentUser } from "@/services/supabase/auth/auth.sign-in";
import { supabaseAdmin } from "./helpers/supabase-test-client";

const TEST_USER = {
    email: process.env.TEST_USER_EMAIL!,
    password: process.env.TEST_USER_PASSWORD!,
};


async function createTestUser() {
    const { data } = await supabaseAdmin.auth.admin.createUser({
        email: TEST_USER.email,
        password: TEST_USER.password,
        email_confirm: true,
    });

    if (data.user) {
        await supabaseAdmin.from("users").insert({
            user_id: data.user.id,
            email: TEST_USER.email,
            full_name: "Integration Test",
            username: "integration_test_signin",
            profile_pic: null,
        });
    }
}

async function deleteTestUser() {
    const { data } = await supabaseAdmin.auth.admin.listUsers();
    const user = data.users.find((u) => u.email === TEST_USER.email);
    if (user) await supabaseAdmin.auth.admin.deleteUser(user.id);
}

beforeAll(async () => {
    await deleteTestUser();
    await createTestUser();
});

afterAll(async () => {
    await deleteTestUser();
});

afterEach(async () => {
    await signOut();
});

describe("signIn — integration", () => {
    it("logs in with correct credentials", async () => {
        const result = await signIn(TEST_USER);

        expect(result.error).toBeNull();
        expect(result.data?.email).toBe(TEST_USER.email);
    });

    it("throws error when password is invalid", async () => {
        const result = await signIn({
            email: TEST_USER.email,
            password: "estanoes",
        });

        expect(result.error).toBe("Email o contraseña incorrectos.");
    });

    it("throws error when email does not exist", async () => {
        const result = await signIn({
            email: "tengohambre@test.com",
            password: "yadijequetengohambreperoesquetengohambreaiuda",
        });

        expect(result.error).toBe("Email o contraseña incorrectos.");
    });

    it("returned profile contains all expected fields", async () => {
        const result = await signIn(TEST_USER);

        expect(result.data).toMatchObject({
            email: TEST_USER.email,
            user_id: expect.any(String),
            username: expect.any(String),
            full_name: expect.any(String),
            created_at: expect.any(String),
            updated_at: expect.any(String),
        });

        expect(result.data).toHaveProperty("profile_pic");
    });

    it("does not allow login after user is deleted", async () => {
        await deleteTestUser();
        try {
            const result = await signIn(TEST_USER);
            expect(result.error).toBe("Email o contraseña incorrectos.");
        } finally {
            await createTestUser();
        }
    });
});

describe("signOut — integration", () => {
    it("signs out successfully", async () => {
        await signIn(TEST_USER);

        const result = await signOut();
        expect(result.error).toBeNull();
    });

    it("getCurrentUser returns null after signOut", async () => {
        await signIn(TEST_USER);
        await signOut();

        const result = await getCurrentUser();
        expect(result).toEqual({ data: null, error: null });
    });

    it("calling signOut without active session does not throw", async () => {
        const result = await signOut();
        expect(result.error).toBeNull();
    });
});

describe("getCurrentUser — integración", () => {
    it("returns null if there is no active session", async () => {
        const result = await getCurrentUser();
        expect(result).toEqual({ data: null, error: null });
    });

    it("returns the user if there is an active session", async () => {
        await signIn(TEST_USER);
        const result = await getCurrentUser();

        expect(result.error).toBeNull();
        expect(result.data?.email).toBe(TEST_USER.email);
    });

    it("profile data matches what is in the BD", async () => {
        await signIn(TEST_USER);
        const result = await getCurrentUser();

        const { data: profile } = await supabaseAdmin
            .from("users")
            .select("*")
            .eq("email", TEST_USER.email)
            .single();

        expect(result.data?.user_id).toBe(profile.user_id);
        expect(result.data?.username).toBe(profile.username);
    });
});