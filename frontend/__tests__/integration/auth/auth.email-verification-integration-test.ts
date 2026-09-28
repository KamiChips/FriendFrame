import { createClient } from "@supabase/supabase-js";
import { signUp } from "@/services/supabase/auth/auth.sign-up";
import { signIn } from "@/services/supabase/auth/auth.sign-in";
import {
    resendVerificationEmail,
    RetryLimitError,
} from "@/services/supabase/auth/auth.helpers";
import { EmailNotConfirmedError } from "@/services/supabase/auth/auth.sign-in";
import { supabaseAdmin } from "../helpers/supabase-test-client";

function createUniqueTestEmail(): string {
    return `test-${Date.now()}-${Math.floor(Math.random()*10000)}@example.com`;
}

function createUniqueUsername(): string {
    return `test_${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}

const TEST_PASSWORD = "TestPassword_123";

describe('Email verification integration test flow', () => {
    let testEmail: string;
    let testUsername: string;
    let testUserId: string;

    beforeEach(() => {
        testEmail = createUniqueTestEmail();
        testUsername = createUniqueUsername();
        testUserId = "";
    });

    afterEach(async () => {
        if (testUserId) {
            await supabaseAdmin.auth.admin.deleteUser(testUserId).catch(() => {});
        }
        await supabaseAdmin.from("users")
            .delete()
            .eq("email", testEmail);
        await supabaseAdmin
            .from("email_verification_retries")
            .delete()
            .eq("email", testEmail);
    });

    it("signUp creates an account with email_confirmed_at as null", async () => {
        const result = await signUp({
            email: testEmail,
            password: TEST_PASSWORD,
            full_name: "Test User",
            username: testUsername,
        });

        expect(result.error).toBeNull();
        expect(result.data).not.toBeNull();

        const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(
            result.data!.user_id,
        );
        testUserId = result.data!.user_id;

        expect(authUserError).toBeNull();
        expect(authUser.user).toBeDefined();
        expect(authUser.user?.email_confirmed_at ?? null).toBeNull();

        const { data: profileRow } = await supabaseAdmin
            .from("users")
            .select("email_confirmed_at")
            .eq("user_id", result.data!.user_id)
            .single();
        
            expect(profileRow?.email_confirmed_at).toBeNull();
    });

    it("Login fails with EmailNotConfirmedError if email is not verified", async () => {
        const signUpResult = await signUp({
            email: testEmail,
            password: TEST_PASSWORD,
            full_name: "Test User",
            username: testUsername,
        });
        testUserId = signUpResult.data!.user_id;

        await expect(
            signIn({ email: testEmail, password: TEST_PASSWORD }),
        ).rejects.toBeInstanceOf(EmailNotConfirmedError);
    });

    it("Verification email resend uses a rate limit", async () => {
        const signUpResult = await signUp({
            email: testEmail,
            password: TEST_PASSWORD,
            full_name: "Test User",
            username: testUsername,
        });
        testUserId = signUpResult.data!.user_id;

        // first resend
        await expect(resendVerificationEmail(testEmail)).resolves.toEqual(
            expect.objectContaining({ emailVerificationSent: true }),
        );

        // second resend 
        let caughtError: unknown;
        try {
            await resendVerificationEmail(testEmail);
        } catch(error) {
            caughtError = error;
            console.log("2do reenvío ->", (error as Error).name, "|", (error as Error).message);
        }

        expect(caughtError).toBeInstanceOf(RetryLimitError);
        expect((caughtError as RetryLimitError).retryAfterSeconds).toBeGreaterThan(0);
    });

    it("check_email_retry_limit RPC shows retry attempts correctly", async () => {
        const { data: first, error: firstError } = await supabaseAdmin
            .rpc("check_email_retry_limit", { user_email: testEmail })
            .single<{ can_retry: boolean, retry_after_seconds: number, attempts_used: number }>();

        expect(firstError).toBeNull();
        expect(first?.can_retry).toBe(true);
        expect(first?.attempts_used).toBe(1);

        const { data: second } = await supabaseAdmin
            .rpc("check_email_retry_limit", { user_email: testEmail })
            .single<{ can_retry: boolean, retry_after_seconds: number, attempts_used: number }>();
        
        expect(second?.can_retry).toBe(false);
        expect(second?.retry_after_seconds).toBeGreaterThan(0);
    });
});
