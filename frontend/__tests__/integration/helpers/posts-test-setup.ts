import { supabaseAdmin } from "./supabase-test-client";

export const USER_A = {
    email: process.env.TEST_USER_A_EMAIL!,
    password: process.env.TEST_USER_A_PASSWORD!,
    user_id: "" as string,
};

export const USER_B = {
    email: process.env.TEST_USER_B_EMAIL!,
    password: process.env.TEST_USER_B_PASSWORD!,
    user_id: "" as string,
};

export async function setupFriends() {
    await cleanupFriends();

    const { data: dataA, error: errorA } = await supabaseAdmin.auth.admin.createUser({
        email: USER_A.email,
        password: USER_A.password,
        email_confirm: true,
        user_metadata: {
            full_name: "User A",
            username: "integration_user_a",
        },
    });

    if (errorA || !dataA.user) {
        throw new Error(`Error creando USER_A: ${errorA?.message ?? "user es null"}`);
    }
    USER_A.user_id = dataA.user.id;
    await new Promise(r => setTimeout(r, 1500));

    const { data: dataB, error: errorB } = await supabaseAdmin.auth.admin.createUser({
        email: USER_B.email,
        password: USER_B.password,
        email_confirm: true,
        user_metadata: {
            full_name: "User B",
            username: "integration_user_b",
        },
    });

    if (errorB || !dataB.user) {
        throw new Error(`Error creando USER_B: ${errorB?.message ?? "user es null"}`);
    }
    USER_B.user_id = dataB.user.id;
    await new Promise(r => setTimeout(r, 1500));

    // A sigue a B y B sigue a A (follows mutuos = amistad)
    const { error: followError } = await supabaseAdmin.from("follows").insert([
        { follower_id: USER_A.user_id, following_id: USER_B.user_id },
        { follower_id: USER_B.user_id, following_id: USER_A.user_id },
    ]);

    if (followError) {
        throw new Error(`Error creando follows: ${followError.message}`);
    }
}

export async function cleanupFriends() {
    const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers();

    const userA = allUsers?.users.find(u => u.email === USER_A.email);
    const userB = allUsers?.users.find(u => u.email === USER_B.email);

    const ids = [userA?.id, userB?.id].filter(Boolean) as string[];

    if (ids.length > 0) {
        await supabaseAdmin.from("fragments").delete().in("author_id", ids);
        await supabaseAdmin.from("posts").delete().in("author_id", ids);
        await supabaseAdmin.from("follows").delete().in("follower_id", ids);
        await supabaseAdmin.from("users").delete().in("user_id", ids);

        for (const id of ids) {
            await supabaseAdmin.auth.admin.deleteUser(id);
        }
    }

    USER_A.user_id = "";
    USER_B.user_id = "";
}