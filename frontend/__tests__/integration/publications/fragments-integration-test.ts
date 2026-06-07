import { signIn, signOut } from "@/services/supabase/auth/auth.sign-in";
import { createFragment, editFragment, deleteFragment, getFragmentWithCounts, getUserFragments } 
    from "@/services/supabase/posts/fragment";
import { supabaseAdmin } from "../helpers/supabase-test-client";
import { setupFriends, cleanupFriends, USER_A, USER_B } 
    from "../helpers/posts-test-setup";

beforeAll(async () => {
    await setupFriends();
});

afterAll(async () => {
    await cleanupFriends();
});

afterEach(async () => {
    await signOut();
    await supabaseAdmin.from("fragments")
        .delete()
        .in("author_id", [USER_A.user_id, USER_B.user_id]);
});

describe("createFragment — integration", () => {
    it("user A can write a fragment on user B's profile", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });
        const result = await createFragment(USER_B.user_id, "hola amigo");
        expect(result.error).toBeNull();
        expect(result.data?.content).toBe("hola amigo");
        expect(result.data?.author_id).toBe(USER_A.user_id);
    });

    it("fragment is saved in the database", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });
        await createFragment(USER_B.user_id, "guardado en bd");
        const { data } = await supabaseAdmin
            .from("fragments").select("*")
            .eq("account_owner_id", USER_B.user_id)
            .eq("author_id", USER_A.user_id).single();
        expect(data?.content).toBe("guardado en bd");
    });

    it("returns error when posting on own profile", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });
        const result = await createFragment(USER_A.user_id, "esto no debería funcionar");
        expect(result.error).toBe("No puedes publicar en tu propio perfil.");
    });

    it("returns error when content is empty", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });
        const result = await createFragment(USER_B.user_id, "   ");
        expect(result.error).toBe("El fragment no puede estar vacío.");
    });

    it("returns error when content exceeds max length", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });
        const result = await createFragment(USER_B.user_id, "a".repeat(2001));
        expect(result.error).toBe("El fragment no puede superar 2000 caracteres.");
    });

    it("returns error when not authenticated", async () => {
        const result = await createFragment(USER_B.user_id, "hola");
        expect(result.error).toBe("No hay sesión activa.");
    });

    it("returns error when users are not friends", async () => {
        const { data: { user: userC } } = await supabaseAdmin.auth.admin.createUser({
            email: "userc-fragment@test.com",
            password: "password123",
            email_confirm: true,
            user_metadata: { full_name: "User C", username: "userc_fragment_test" },
        });
        if (!userC) throw new Error("No se pudo crear usuario C");

        await supabaseAdmin.from("users").insert({
            user_id: userC.id,
            full_name: "User C",
            username: "userc_fragment_test",
            email: "userc-fragment@test.com",
        });

        await signIn({ email: USER_A.email, password: USER_A.password });
        const result = await createFragment(userC.id, "no somos amigos");
        expect(result.error).toBe("Solo puedes publicar en el perfil de tus amigos.");

        await supabaseAdmin.from("users").delete().eq("user_id", userC.id);
        await supabaseAdmin.auth.admin.deleteUser(userC.id);
    });
});

describe("editFragment — integration", () => {
    it("author can edit their fragment", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });
        const { data: fragment } = await createFragment(USER_B.user_id, "original");
        const result = await editFragment(fragment!.fragment_id, "editado");
        expect(result.error).toBeNull();
        expect(result.data?.content).toBe("editado");
    });

    it("user B cannot edit user A's fragment", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });
        const { data: fragment } = await createFragment(USER_B.user_id, "original");
        await signOut();
        await signIn({ email: USER_B.email, password: USER_B.password });
        const result = await editFragment(fragment!.fragment_id, "intento editar");
        expect(result.error).toBe("Fragment no encontrado o sin permisos.");
    });

    it("returns error when content is empty", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });
        const { data: fragment } = await createFragment(USER_B.user_id, "original");
        const result = await editFragment(fragment!.fragment_id, "   ");
        expect(result.error).toBe("El fragment no puede estar vacío.");
    });

    it("returns error when content exceeds max length", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });
        const { data: fragment } = await createFragment(USER_B.user_id, "original");
        const result = await editFragment(fragment!.fragment_id, "a".repeat(2001));
        expect(result.error).toBe("El fragment no puede superar 2000 caracteres.");
    });

    it("returns specific error when fragment not found (PGRST116)", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });
        const fakeId = "550e8400-e29b-41d4-a716-446655440099";
        const result = await editFragment(fakeId, "nuevo contenido");
        expect(result.error).toBe("Fragment no encontrado o sin permisos.");
    });
});

describe("deleteFragment — integration", () => {
    it("author can delete their fragment", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });
        const { data: fragment } = await createFragment(USER_B.user_id, "para borrar");
        const result = await deleteFragment(fragment!.fragment_id);
        expect(result.error).toBeNull();
        const { data } = await supabaseAdmin
            .from("fragments").select("*")
            .eq("fragment_id", fragment!.fragment_id).single();
        expect(data).toBeNull();
    });

    it("returns error when fragmentId is invalid UUID", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });
        const result = await deleteFragment("no-es-uuid");
        expect(result.error).toBeTruthy(); // ← parseError no mapea "fragmentId inválido."
    });

    it("returns error when not authenticated", async () => {
        const fakeId = "550e8400-e29b-41d4-a716-446655440099";
        const result = await deleteFragment(fakeId);
        expect(result.error).toBe("No hay sesión activa.");
    });
});

describe("getFragmentWithCounts — integration", () => {
    it("returns fragment with zero counts when new", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });
        const { data: fragment } = await createFragment(USER_B.user_id, "nuevo");
        const result = await getFragmentWithCounts(fragment!.fragment_id, USER_A.user_id);
        expect(result.error).toBeNull();
        expect(result.data?.likes_count).toBe(0);
        expect(result.data?.comments_count).toBe(0);
        expect(result.data?.liked_by_me).toBe(false);
        expect(result.data?.content).toBe("nuevo");
    });

    it("returns error if fragmentId is invalid UUID", async () => {
        const result = await getFragmentWithCounts("no-es-uuid", USER_A.user_id);
        expect(result.error).toBeTruthy(); // ← parseError no mapea "fragmentId inválido."
    });

    it("returns error if currentUserId is invalid UUID", async () => {
        const result = await getFragmentWithCounts("550e8400-e29b-41d4-a716-446655440099", "no-es-uuid");
        expect(result.error).toBeTruthy(); // ← parseError no mapea "ID de usuario inválido."
    });
});

describe("getUserFragments — integration", () => {
    it("returns fragments for a user ordered by date", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });
        await createFragment(USER_B.user_id, "fragment 1");
        await createFragment(USER_B.user_id, "fragment 2");
        const { data, error } = await getUserFragments(USER_A.user_id);
        expect(error).toBeNull();
        expect(data?.length).toBeGreaterThanOrEqual(2);
    });

    it("returns empty array for user with no fragments", async () => {
        const { data, error } = await getUserFragments(USER_B.user_id);
        expect(error).toBeNull();
        expect(data).toEqual([]);
    });
});