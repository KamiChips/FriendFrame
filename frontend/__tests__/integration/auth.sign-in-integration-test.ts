import { signIn, signOut, getCurrentUser, } from "@/services/supabase/auth/auth.sign-in";
import { signUp } from "@/services/supabase/auth/auth.sign-up";
import { supabaseAdmin } from "./helpers/supabase-test-client";

const TEST_USER = {
    email: process.env.TEST_USER_EMAIL!,
    password: process.env.TEST_USER_PASSWORD!,
    full_name: "Integration Testing",
    username: "integration_test_signin_2",
};

async function createTestUser() {
    const result = await signUp(TEST_USER);

    if (result.error) {
        throw new Error(
            `Failed to create test user: ${result.error}`
        );
    }
}

async function deleteTestUser() {
    await supabaseAdmin
        .from("users")
        .delete()
        .eq("email", TEST_USER.email);

    const { data } = await supabaseAdmin.auth.admin.listUsers();

    const user = data.users.find(
        (u) => u.email?.toLowerCase() === TEST_USER.email.toLowerCase()
    );

    if (user) {
        await supabaseAdmin.auth.admin.deleteUser(user.id);
    }
}

beforeEach(async () => {
    await signOut(); 
    await deleteTestUser();
    await createTestUser();
});

afterEach(async () => {
    await signOut();
});

afterAll(async () => {
    await deleteTestUser();
});

describe("signIn — integration", () => {
    it("logs in with correct credentials", async () => {
        const result = await signIn({
            email: TEST_USER.email,
            password: TEST_USER.password,
        });

        expect(result.error).toBeNull();
        expect(result.data?.email.toLowerCase()).toBe(
            TEST_USER.email.toLowerCase()
        );
    });

    it("throws error when password is invalid", async () => {
        const result = await signIn({
            email: TEST_USER.email,
            password: "estanoes",
        });

        expect(result.error).toBe(
            "Email o contraseña incorrectos."
        );
    });

    it("throws error when email does not exist", async () => {
        const result = await signIn({
            email: "tengohambre@gmail.com",
            password:
                "yadijequetengohambreperoesqueTengohambreaiuda_1",
        });

        expect(result.error).toBe(
            "Email o contraseña incorrectos."
        );
    });

    it("returned profile contains all expected fields", async () => {
        const result = await signIn({
            email: TEST_USER.email,
            password: TEST_USER.password,
        });

        expect(result.error).toBeNull();

        expect(result.data).toMatchObject({
            email: TEST_USER.email,
            user_id: expect.any(String),
            username: TEST_USER.username,
            full_name: TEST_USER.full_name,
            created_at: expect.any(String),
            updated_at: expect.any(String),
        });

        expect(result.data).toHaveProperty("profile_pic");
    });

    it("does not allow login after user is deleted", async () => {
        await deleteTestUser();

        const result = await signIn({
            email: TEST_USER.email,
            password: TEST_USER.password,
        });

        expect(result.error).toBe(
            "Email o contraseña incorrectos."
        );
    });
});

describe("signOut — integration", () => {
    it("signs out successfully", async () => {
        await signIn({
            email: TEST_USER.email,
            password: TEST_USER.password,
        });

        const result = await signOut();

        expect(result.error).toBeNull();
    });

    it("getCurrentUser returns null after signOut", async () => {
        await signIn({
            email: TEST_USER.email,
            password: TEST_USER.password,
        });

        await signOut();

        const result = await getCurrentUser();

        expect(result).toEqual({
            data: null,
            error: null,
        });
    });

    it("calling signOut without active session does not throw", async () => {
        const result = await signOut();

        expect(result.error).toBeNull();
    });
});

describe("getCurrentUser — integration", () => {
    it("returns null if there is no active session", async () => {
        await signOut();

        const result = await getCurrentUser();

        expect(result).toEqual({
            data: null,
            error: null,
        });
    });

    it("returns the user if there is an active session", async () => {
        await signIn({
            email: TEST_USER.email,
            password: TEST_USER.password,
        });

        const result = await getCurrentUser();

        expect(result.error).toBeNull();
        expect(result.data?.email.toLowerCase()).toBe(
            TEST_USER.email.toLowerCase()
        );
    });

    it("profile data matches what is in the BD", async () => {
        await signIn({
            email: TEST_USER.email,
            password: TEST_USER.password,
        });

        const result = await getCurrentUser();

        const { data: profile } = await supabaseAdmin
            .from("users")
            .select("*")
            .eq("email", TEST_USER.email)
            .single();

        expect(profile).not.toBeNull();

        expect(result.data?.user_id).toBe(profile.user_id);
        expect(result.data?.username).toBe(profile.username);
        expect(result.data?.email).toBe(profile.email);
    });
});